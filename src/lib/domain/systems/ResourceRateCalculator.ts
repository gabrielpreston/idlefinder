/**
 * Resource Rate Calculator - Shared utility for resource generation rate calculations
 * Extracted multiplier functions from SlotGenerationSystem for better organization
 */

import type { Facility } from '../entities/Facility';

/**
 * Get facility multiplier based on tier
 * Formula: 1 + 0.25 * (tier - 1)
 * 
 * @param facility Facility entity
 * @returns Multiplier value (1.0 for tier 1, 1.25 for tier 2, etc.)
 */
export function getFacilityMultiplier(facility: Facility): number {
	return 1 + 0.25 * (facility.attributes.tier - 1);
}

/**
 * Get worker multiplier based on assignee type
 * Player: 1.0, Adventurer: 1.5
 * 
 * @param assigneeType Type of assignee ('player' or 'adventurer')
 * @returns Multiplier value (1.0 for player, 1.5 for adventurer)
 */
export function getWorkerMultiplier(assigneeType: 'player' | 'adventurer'): number {
	return assigneeType === 'player' ? 1.0 : 1.5;
}

