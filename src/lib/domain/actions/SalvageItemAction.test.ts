/**
 * SalvageItemAction Tests
 */

import { describe, it, expect } from 'vitest';
import { SalvageItemAction } from './SalvageItemAction';
import { Item } from '../entities/Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import type { RequirementContext } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';

function createTestItem(overrides?: {
	id?: string;
	rarity?: 'common' | 'uncommon' | 'rare';
	baseValue?: number;
}): Item {
	const id = Identifier.from<'ItemId'>(overrides?.id || 'item-1');
	return new Item(
		id,
		{
			itemType: 'weapon',
			rarity: overrides?.rarity || 'common',
			stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
			durability: 100,
			maxDurability: 100,
			baseValue: overrides?.baseValue ?? 10
		},
		[],
		'InArmory',
		{},
		{}
	);
}

describe('SalvageItemAction', () => {
	describe('computeEffects', () => {
		it('should throw error when item not found', () => {
			const entities = new Map();
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new SalvageItemAction('nonexistent-item');

			expect(() => {
				action.computeEffects(context, {});
			}).toThrow('Item nonexistent-item not found');
		});

		it('should calculate yields for common item', () => {
			const item = createTestItem({ id: 'item-1', rarity: 'common', baseValue: 100 });
			const entities = new Map([[item.id, item]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new SalvageItemAction('item-1');
			const effects = action.computeEffects(context, {});

			expect(effects.length).toBe(1);
			// Common items: 50% materials, 0 rare essence
		});

		it('should calculate yields for rare item', () => {
			const item = createTestItem({ id: 'item-1', rarity: 'rare', baseValue: 100 });
			const entities = new Map([[item.id, item]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new SalvageItemAction('item-1');
			const effects = action.computeEffects(context, {});

			expect(effects.length).toBe(1);
			// Rare items: 50% materials, 10% rare essence
		});

		it('should use provided yields when specified', () => {
			const item = createTestItem({ id: 'item-1' });
			const entities = new Map([[item.id, item]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new SalvageItemAction('item-1', 50, 10);
			// When materialsAmount is provided in params, it uses that
			const effects = action.computeEffects(context, {
				materialsAmount: 50,
				rareEssenceAmount: 10
			});

			expect(effects.length).toBe(1);
		});

		it('should calculate yields when not provided', () => {
			const item = createTestItem({ id: 'item-1', baseValue: 100 });
			const entities = new Map([[item.id, item]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new SalvageItemAction('item-1');
			const effects = action.computeEffects(context, {});

			expect(effects.length).toBe(1);
		});
	});

	describe('generateEvents', () => {
		it('should return ItemSalvaged event', () => {
			const item = createTestItem({ id: 'item-1' });
			const entities = new Map([[item.id, item]]);
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('materials', 50),
				new ResourceUnit('rareEssence', 10)
			]);
			const effects: any[] = [];

			const action = new SalvageItemAction('item-1');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('ItemSalvaged');
		});
	});
});

