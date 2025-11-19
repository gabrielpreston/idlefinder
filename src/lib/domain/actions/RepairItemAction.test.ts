/**
 * RepairItemAction Tests
 */

import { describe, it, expect } from 'vitest';
import { RepairItemAction } from './RepairItemAction';
import { Item } from '../entities/Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import type { RequirementContext } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';

function createTestItem(overrides?: {
	id?: string;
	durability?: number;
	maxDurability?: number;
}): Item {
	const id = Identifier.from<'ItemId'>(overrides?.id || 'item-1');
	return new Item(
		id,
		{
			itemType: 'weapon',
			rarity: 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability: overrides?.durability ?? 100,
			maxDurability: overrides?.maxDurability ?? 100,
			baseValue: 10
		},
		[],
		'InArmory',
		{},
		{}
	);
}

describe('RepairItemAction', () => {
	describe('requirement evaluation', () => {
		it('should fail when item not found', () => {
			const entities = new Map();
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new RepairItemAction('nonexistent-item');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('does not exist');
		});

		it('should fail when item is at full durability', () => {
			const item = createTestItem({ id: 'item-1' });
			// Item starts at full durability
			const entities = new Map([[item.id, item]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new RepairItemAction('item-1');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('full durability');
		});

		it('should pass when item needs repair', () => {
			const item = createTestItem({ id: 'item-1' });
			// Damage the item
			item.applyDamage(50);
			const entities = new Map([[item.id, item]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new RepairItemAction('item-1');
			const result = action.execute(context, {});

			expect(result.success).toBe(true);
			expect(result.effects.length).toBe(1);
		});
	});

	describe('generateEvents', () => {
		it('should return empty array when item not found', () => {
			const entities = new Map();
			const resources = new ResourceBundle(new Map());
			const effects: any[] = [];

			const action = new RepairItemAction('nonexistent-item');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return ItemRepaired event when item exists', () => {
			const item = createTestItem({ id: 'item-1' });
			const entities = new Map([[item.id, item]]);
			const resources = new ResourceBundle(new Map());
			const effects: any[] = [];

			const action = new RepairItemAction('item-1');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('ItemRepaired');
		});
	});
});

