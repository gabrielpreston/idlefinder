/**
 * Crafting Duration Modifiers
 *
 * Applies modifiers to crafting durations based on various factors:
 * - Facility bonuses (future: Armory/Blacksmith tier reduces crafting time)
 * - Recipe type bonuses (future: item type modifiers)
 * - Rarity bonuses (future: rare items take longer)
 *
 * Pattern: Follows MissionDurationModifiers pattern
 * Reference: src/lib/domain/systems/MissionDurationModifiers.ts
 */

import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import { Duration } from '../valueObjects/Duration';
import {
	type DurationModifier,
	calculateEffectiveDuration as calculateEffectiveDurationBase
} from '../primitives/DurationModifiers';
import type { CraftingRecipe } from '../data/crafting/recipes';

/**
 * Calculate effective crafting duration with all modifiers applied
 *
 * @param recipe Crafting recipe template
 * @param facility Facility entity (optional, future: Armory/Blacksmith facility)
 * @param state GameState for querying facilities and other modifiers
 * @returns Effective duration with modifiers applied
 */
export function calculateEffectiveCraftingDuration(
	recipe: CraftingRecipe,
	facility: Facility | undefined,
	state: GameState
): Duration {
	const baseDuration = recipe.duration;
	const modifiers = collectCraftingDurationModifiers(recipe, facility, state);
	return calculateEffectiveDurationBase(baseDuration, modifiers);
}

/**
 * Collect all duration modifiers from various sources
 *
 * Pattern: Similar to MissionDurationModifiers modifier collection
 * Reference: src/lib/domain/systems/MissionDurationModifiers.ts:47-75
 */
function collectCraftingDurationModifiers(
	_recipe: CraftingRecipe,
	_facility: Facility | undefined,
	_state: GameState
): DurationModifier[] {
	const modifiers: DurationModifier[] = [];

	// Future: Facility bonuses (e.g., Armory/Blacksmith tier reduces crafting time)
	// Note: Current facility types don't include Armory/Blacksmith (documented as future)
	// Reference: src/lib/domain/attributes/FacilityAttributes.ts:7
	// const facilityModifier = getFacilityCraftingBonus(facility, state);
	// if (facilityModifier !== 1.0) {
	// 	modifiers.push({ multiplier: facilityModifier, source: 'Facility Bonus' });
	// }

	// Future: Recipe type bonuses (e.g., item type modifiers)
	// const typeModifier = getRecipeTypeDurationBonus(recipe.itemType);
	// if (typeModifier !== 1.0) {
	// 	modifiers.push({ multiplier: typeModifier, source: 'Recipe Type Bonus' });
	// }

	// Future: Rarity bonuses (e.g., rare items take longer)
	// const rarityModifier = getRarityDurationBonus(recipe.rarity);
	// if (rarityModifier !== 1.0) {
	// 	modifiers.push({ multiplier: rarityModifier, source: 'Rarity Bonus' });
	// }

	return modifiers;
}

