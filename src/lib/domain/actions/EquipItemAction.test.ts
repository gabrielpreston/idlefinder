/**
 * EquipItemAction Tests
 */

import { describe, it, expect } from 'vitest';
import { EquipItemAction } from './EquipItemAction';
import { createTestAdventurer } from '../../test-utils/testFactories';
import { Item } from '../entities/Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import type { RequirementContext, Entity } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';
import type { Effect } from '../primitives/Effect';
import { GameConfig } from '../config/GameConfig';

function createTestItem(overrides?: {
	id?: string;
	itemType?: 'weapon' | 'armor' | 'offHand' | 'accessory';
	state?: 'InArmory' | 'Equipped';
	durability?: number;
	maxDurability?: number;
}): Item {
	const id = Identifier.from<'ItemId'>(overrides?.id || 'item-1');
	return new Item(
		id,
		{
			itemType: overrides?.itemType || 'weapon',
			rarity: 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability: overrides?.durability ?? GameConfig.items.maxDurability,
			maxDurability: overrides?.maxDurability ?? GameConfig.items.maxDurability,
			baseValue: 10
		},
		[],
		overrides?.state || 'InArmory',
		{},
		{}
	);
}

describe('EquipItemAction', () => {
	describe('getRequirements', () => {
		it('should return requirements for item and adventurer', () => {
			const action = new EquipItemAction('item-1', 'adv-1', 'weapon');
			const requirements = action.getRequirements();

			expect(requirements.length).toBe(1); // allRequirements wraps them
		});
	});

	describe('requirement evaluation', () => {
		it('should fail when item not found', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new EquipItemAction('nonexistent-item', 'adv-1', 'weapon');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('does not exist');
		});

		it('should fail when item not in armory', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon', state: 'Equipped' });
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new EquipItemAction('item-1', 'adv-1', 'weapon');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('not in armory');
		});

		it('should fail when item is broken', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon', state: 'InArmory' });
			// Break the item by setting durability to 0
			item.applyDamage(1000); // More than max durability
			// Item might change state to Broken, but requirement checks state first
			// If state is still InArmory but broken, the broken check should catch it
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new EquipItemAction('item-1', 'adv-1', 'weapon');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			// Item might fail on state check (if state changed to Broken) or broken check
			expect(result.error).toMatch(/broken|not in armory/);
		});

		it('should fail when item type does not match slot', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'armor', state: 'InArmory' });
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new EquipItemAction('item-1', 'adv-1', 'weapon'); // Wrong slot
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('does not match slot');
		});

		it('should pass when all requirements met', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon', state: 'InArmory' });
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new EquipItemAction('item-1', 'adv-1', 'weapon');
			const result = action.execute(context, {});

			expect(result.success).toBe(true);
			expect(result.effects.length).toBe(1);
		});
	});

	describe('generateEvents', () => {
		it('should return empty array when item not found', () => {
			const entities = new Map<string, Entity>();
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new EquipItemAction('nonexistent-item', 'adv-1', 'weapon');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events).toEqual([]);
		});

		it('should return empty array when adventurer not found', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon' });
			const entities = new Map([[item.id, item]]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new EquipItemAction('item-1', 'nonexistent-adv', 'weapon');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events).toEqual([]);
		});

		it('should return ItemEquipped event when both exist', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon' });
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new EquipItemAction('item-1', 'adv-1', 'weapon');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('ItemEquipped');
		});

		it('should handle different slot types', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'armor' });
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new EquipItemAction('item-1', 'adv-1', 'armor');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events.length).toBe(1);
			if (events[0]?.type === 'ItemEquipped') {
				expect((events[0].payload as { slot: string }).slot).toBe('armor');
			}
		});
	});
});

