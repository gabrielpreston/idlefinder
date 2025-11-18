/**
 * Crafting Recipe Templates - Static data classes (not entities)
 * Per plan correction: CraftingRecipe is a template class, following pattern of TaskArchetype
 * Reference: docs/current/12-crafting-armory.md:33-51
 */

import { Duration } from '../../valueObjects/Duration';
import { ResourceBundle } from '../../valueObjects/ResourceBundle';
import { ResourceUnit } from '../../valueObjects/ResourceUnit';
import type { ItemType, ItemRarity } from '../../attributes/ItemAttributes';

export type CraftingRecipeId = string;

/**
 * Crafting Recipe Template - Static data defining how to craft an item
 * Per plan Phase 3.1: Template class (not entity)
 */
export class CraftingRecipe {
	constructor(
		public readonly id: CraftingRecipeId,
		public readonly itemType: ItemType,
		public readonly rarity: ItemRarity,
		public readonly input: ResourceBundle, // materials, rareEssence, gold
		public readonly duration: Duration, // Crafting time
		public readonly output: {
			itemType: ItemType;
			rarity: ItemRarity;
			baseStats: Record<string, number>; // Stat values for created item
			baseValue: number; // Gold value of created item
		}
	) {}
}

/**
 * Default crafting recipes per docs/current/12-crafting-armory.md:144-224
 */
export function getDefaultCraftingRecipes(): CraftingRecipe[] {
	const recipes: CraftingRecipe[] = [];

	// Common Items
	recipes.push(
		new CraftingRecipe(
			'common-weapon',
			'weapon',
			'common',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 10),
				new ResourceUnit('gold', 50)
			]),
			Duration.ofMinutes(5),
			{
				itemType: 'weapon',
				rarity: 'common',
				baseStats: { attackBonus: 1, damageBonus: 1 },
				baseValue: 50
			}
		),
		new CraftingRecipe(
			'common-armor',
			'armor',
			'common',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 15),
				new ResourceUnit('gold', 75)
			]),
			Duration.ofMinutes(5),
			{
				itemType: 'armor',
				rarity: 'common',
				baseStats: { armorClass: 1, damageReduction: 1 },
				baseValue: 75
			}
		),
		new CraftingRecipe(
			'common-offHand',
			'offHand',
			'common',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 8),
				new ResourceUnit('gold', 40)
			]),
			Duration.ofMinutes(5),
			{
				itemType: 'offHand',
				rarity: 'common',
				baseStats: { armorClass: 1 },
				baseValue: 40
			}
		),
		new CraftingRecipe(
			'common-accessory',
			'accessory',
			'common',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 5),
				new ResourceUnit('gold', 25)
			]),
			Duration.ofMinutes(5),
			{
				itemType: 'accessory',
				rarity: 'common',
				baseStats: { skillBonus: 1, critSafety: 1 },
				baseValue: 25
			}
		)
	);

	// Uncommon Items (2-3x cost, 15 minutes)
	recipes.push(
		new CraftingRecipe(
			'uncommon-weapon',
			'weapon',
			'uncommon',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 25),
				new ResourceUnit('gold', 150)
			]),
			Duration.ofMinutes(15),
			{
				itemType: 'weapon',
				rarity: 'uncommon',
				baseStats: { attackBonus: 2, damageBonus: 2 },
				baseValue: 150
			}
		),
		new CraftingRecipe(
			'uncommon-armor',
			'armor',
			'uncommon',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 35),
				new ResourceUnit('gold', 200)
			]),
			Duration.ofMinutes(15),
			{
				itemType: 'armor',
				rarity: 'uncommon',
				baseStats: { armorClass: 2, damageReduction: 2 },
				baseValue: 200
			}
		),
		new CraftingRecipe(
			'uncommon-offHand',
			'offHand',
			'uncommon',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 20),
				new ResourceUnit('gold', 100)
			]),
			Duration.ofMinutes(15),
			{
				itemType: 'offHand',
				rarity: 'uncommon',
				baseStats: { armorClass: 2 },
				baseValue: 100
			}
		),
		new CraftingRecipe(
			'uncommon-accessory',
			'accessory',
			'uncommon',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 12),
				new ResourceUnit('gold', 60)
			]),
			Duration.ofMinutes(15),
			{
				itemType: 'accessory',
				rarity: 'uncommon',
				baseStats: { skillBonus: 2, critSafety: 2 },
				baseValue: 60
			}
		)
	);

	// Rare Items (5-10x cost + rare essence, 60 minutes)
	recipes.push(
		new CraftingRecipe(
			'rare-weapon',
			'weapon',
			'rare',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 50),
				new ResourceUnit('rareEssence', 5),
				new ResourceUnit('gold', 500)
			]),
			Duration.ofMinutes(60),
			{
				itemType: 'weapon',
				rarity: 'rare',
				baseStats: { attackBonus: 4, damageBonus: 4 },
				baseValue: 500
			}
		),
		new CraftingRecipe(
			'rare-armor',
			'armor',
			'rare',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 75),
				new ResourceUnit('rareEssence', 8),
				new ResourceUnit('gold', 750)
			]),
			Duration.ofMinutes(60),
			{
				itemType: 'armor',
				rarity: 'rare',
				baseStats: { armorClass: 4, damageReduction: 4 },
				baseValue: 750
			}
		),
		new CraftingRecipe(
			'rare-offHand',
			'offHand',
			'rare',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 40),
				new ResourceUnit('rareEssence', 3),
				new ResourceUnit('gold', 400)
			]),
			Duration.ofMinutes(60),
			{
				itemType: 'offHand',
				rarity: 'rare',
				baseStats: { armorClass: 4 },
				baseValue: 400
			}
		),
		new CraftingRecipe(
			'rare-accessory',
			'accessory',
			'rare',
			ResourceBundle.fromArray([
				new ResourceUnit('materials', 25),
				new ResourceUnit('rareEssence', 2),
				new ResourceUnit('gold', 250)
			]),
			Duration.ofMinutes(60),
			{
				itemType: 'accessory',
				rarity: 'rare',
				baseStats: { skillBonus: 4, critSafety: 4 },
				baseValue: 250
			}
		)
	);

	return recipes;
}

