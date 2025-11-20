/**
 * UnequipItemAction Tests
 */

import { describe, it, expect } from 'vitest';
import { UnequipItemAction } from './UnequipItemAction';
import { createTestAdventurer } from '../../test-utils/testFactories';
import { Item } from '../entities/Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import type { RequirementContext, Entity } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';
import type { Effect } from '../primitives/Effect';

function createTestItem(overrides?: {
	id?: string;
	itemType?: 'weapon' | 'armor' | 'offHand' | 'accessory';
	state?: 'InArmory' | 'Equipped';
}): Item {
	const id = Identifier.from<'ItemId'>(overrides?.id || 'item-1');
	return new Item(
		id,
		{
			itemType: overrides?.itemType || 'weapon',
			rarity: 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability: 100,
			maxDurability: 100,
			baseValue: 10
		},
		[],
		overrides?.state || 'InArmory',
		{},
		{}
	);
}

describe('UnequipItemAction', () => {
	describe('requirement evaluation', () => {
		it('should fail when item not found', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new UnequipItemAction('nonexistent-item', 'adv-1', 'weapon');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('does not exist');
		});

		it('should fail when item not equipped', () => {
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

			const action = new UnequipItemAction('item-1', 'adv-1', 'weapon');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('not equipped');
		});

		it('should pass when item is equipped', () => {
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

			const action = new UnequipItemAction('item-1', 'adv-1', 'weapon');
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

			const action = new UnequipItemAction('nonexistent-item', 'adv-1', 'weapon');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return empty array when adventurer not found', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon' });
			const entities = new Map<string, Entity>([[item.id, item]]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new UnequipItemAction('item-1', 'nonexistent-adv', 'weapon');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return ItemUnequipped event when both exist', () => {
			const item = createTestItem({ id: 'item-1', itemType: 'weapon' });
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				[item.id, item],
				[adventurer.id, adventurer]
			]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new UnequipItemAction('item-1', 'adv-1', 'weapon');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('ItemUnequipped');
		});
	});
});

