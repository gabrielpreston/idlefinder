/**
 * Item Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { Item } from './Item';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { GameConfig } from '../config/GameConfig';

function createTestItem(overrides?: {
	durability?: number;
	maxDurability?: number;
	state?: 'InArmory' | 'Equipped' | 'Broken';
}): Item {
	const id = Identifier.from<'ItemId'>('item-1');
	return new Item(
		id,
		{
			itemType: 'weapon',
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

describe('Item', () => {
	describe('constructor', () => {
		it('should create valid item', () => {
			const item = createTestItem();
			expect(item.type).toBe('Item');
			expect(item.attributes.durability).toBe(GameConfig.items.maxDurability);
			expect(item.state).toBe('InArmory');
		});

		it('should throw error for durability below 0', () => {
			expect(() => createTestItem({ durability: -1 })).toThrow(
				'Item durability (-1) must be between 0 and maxDurability (100)'
			);
		});

		it('should throw error for durability above maxDurability', () => {
			expect(() => createTestItem({ durability: 150, maxDurability: 100 })).toThrow(
				'Item durability (150) must be between 0 and maxDurability (100)'
			);
		});
	});

	describe('equip', () => {
		it('should equip item to adventurer', () => {
			const item = createTestItem({ state: 'InArmory' });
			const adventurerId = Identifier.from<'AdventurerId'>('adv-1');

			item.equip(adventurerId);

			expect(item.state).toBe('Equipped');
			expect(item.metadata.equippedBy).toBe('adv-1');
		});

		it('should throw error when item is not InArmory', () => {
			const item = createTestItem({ state: 'Equipped' });
			const adventurerId = Identifier.from<'AdventurerId'>('adv-1');

			expect(() => { item.equip(adventurerId); }).toThrow('Cannot equip item: item state is Equipped');
		});

		it('should throw error when item is broken', () => {
			const item = createTestItem({ durability: 0, state: 'InArmory' });
			const adventurerId = Identifier.from<'AdventurerId'>('adv-1');

			expect(() => { item.equip(adventurerId); }).toThrow('Cannot equip broken item');
		});
	});

	describe('unequip', () => {
		it('should unequip item from adventurer', () => {
			const item = createTestItem({ state: 'Equipped' });
			item.metadata.equippedBy = 'adv-1';

			item.unequip();

			expect(item.state).toBe('InArmory');
			expect(item.metadata.equippedBy).toBeUndefined();
		});

		it('should throw error when item is not Equipped', () => {
			const item = createTestItem({ state: 'InArmory' });

			expect(() => { item.unequip(); }).toThrow('Cannot unequip item: item state is InArmory');
		});
	});

	describe('repair', () => {
		it('should repair damaged item', () => {
			const item = createTestItem({ durability: 50 });

			item.repair();

			expect(item.attributes.durability).toBe(GameConfig.items.maxDurability);
		});

		it('should transition Broken item to InArmory when repaired', () => {
			const item = createTestItem({ durability: 0, state: 'Broken' });

			item.repair();

			expect(item.attributes.durability).toBe(GameConfig.items.maxDurability);
			expect(item.state).toBe('InArmory');
		});

		it('should throw error when item is already at full durability', () => {
			const item = createTestItem({ durability: GameConfig.items.maxDurability });

			expect(() => { item.repair(); }).toThrow('Item is already at full durability');
		});
	});

	describe('applyDamage', () => {
		it('should reduce durability', () => {
			const item = createTestItem({ durability: 100 });

			item.applyDamage(25);

			expect(item.attributes.durability).toBe(75);
		});

		it('should transition to Broken when durability reaches 0', () => {
			const item = createTestItem({ durability: 10 });

			item.applyDamage(10);

			expect(item.attributes.durability).toBe(0);
			expect(item.state).toBe('Broken');
		});

		it('should not allow durability below 0', () => {
			const item = createTestItem({ durability: 10 });

			item.applyDamage(20);

			expect(item.attributes.durability).toBe(0);
		});

		it('should throw error for negative damage', () => {
			const item = createTestItem({ durability: 100 });

			expect(() => { item.applyDamage(-10); }).toThrow('Cannot apply negative damage: -10');
		});
	});

	describe('isBroken', () => {
		it('should return true when durability is 0', () => {
			const item = createTestItem({ durability: 0 });

			expect(item.isBroken()).toBe(true);
		});

		it('should return true when state is Broken', () => {
			const item = createTestItem({ state: 'Broken' });

			expect(item.isBroken()).toBe(true);
		});

		it('should return false when item is intact', () => {
			const item = createTestItem({ durability: 100, state: 'InArmory' });

			expect(item.isBroken()).toBe(false);
		});
	});
});

