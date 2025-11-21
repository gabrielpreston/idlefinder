/**
 * Mission Duration Modifiers
 *
 * Applies modifiers to mission durations based on various factors:
 * - Facility bonuses
 * - Adventurer abilities
 * - Mission type bonuses
 * - Other game state factors
 *
 * Pattern: Follows SlotGenerationSystem multiplier pattern
 * Reference: src/lib/domain/systems/SlotGenerationSystem.ts:29-82
 */

import type { GameState } from '../entities/GameState';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';
import { Duration } from '../valueObjects/Duration';
import {
	type DurationModifier,
	calculateEffectiveDuration as calculateEffectiveDurationBase
} from '../primitives/DurationModifiers';

/**
 * Calculate effective mission duration with all modifiers applied
 *
 * @param mission Mission entity
 * @param adventurer Adventurer assigned to mission (optional)
 * @param state GameState for querying facilities and other modifiers
 * @returns Effective duration with modifiers applied
 */
export function calculateEffectiveDuration(
	mission: Mission,
	adventurer: Adventurer | undefined,
	state: GameState
): Duration {
	const baseDuration = mission.attributes.baseDuration;
	const modifiers = collectMissionDurationModifiers(mission, adventurer, state);
	return calculateEffectiveDurationBase(baseDuration, modifiers);
}

/**
 * Collect all duration modifiers from various sources
 *
 * Pattern: Similar to SlotGenerationSystem's multiplier collection
 * Reference: src/lib/domain/systems/SlotGenerationSystem.ts:80-82
 */
function collectMissionDurationModifiers(
	_mission: Mission,
	_adventurer: Adventurer | undefined,
	_state: GameState
): DurationModifier[] {
	const modifiers: DurationModifier[] = [];

	// Example: Facility bonuses (future system)
	// const facilityModifier = getFacilityDurationBonus(state);
	// if (facilityModifier !== 1.0) {
	// 	modifiers.push({ multiplier: facilityModifier, source: 'Facility Bonus' });
	// }

	// Example: Adventurer ability bonuses (future system)
	// if (adventurer) {
	// 	const abilityModifier = getAdventurerDurationBonus(adventurer, mission);
	// 	if (abilityModifier !== 1.0) {
	// 		modifiers.push({ multiplier: abilityModifier, source: 'Adventurer Ability' });
	// 	}
	// }

	// Example: Mission type bonuses (future system)
	// const typeModifier = getMissionTypeDurationBonus(mission.attributes.missionType);
	// if (typeModifier !== 1.0) {
	// 	modifiers.push({ multiplier: typeModifier, source: 'Mission Type Bonus' });
	// }

	return modifiers;
}

