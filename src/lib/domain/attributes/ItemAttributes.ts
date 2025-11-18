/**
 * Item Attributes - Structured data describing item capabilities
 * Per Systems Primitives Spec and docs/current/11-equipment-auto-equip.md
 */

import type { NumericStatMap } from '../valueObjects/NumericStatMap';

export type ItemType = 'weapon' | 'armor' | 'offHand' | 'accessory' | 'consumable';
export type ItemRarity = 'common' | 'uncommon' | 'rare';

export interface ItemAttributes {
	itemType: ItemType;
	rarity: ItemRarity;
	stats: NumericStatMap; // attackBonus, damageBonus, armorClass, damageReduction, skillBonus, critSafety
	durability: number; // Current durability (0-100)
	maxDurability: number; // Maximum durability (typically 100)
	baseValue: number; // Base gold value of item
}

