/**
 * Facility Effect Queries
 * 
 * Queries for aggregating facility effects and resource slot availability.
 * Aggregates getActiveEffects() across facilities of the same type.
 */

import type { GameState } from '../entities/GameState';
import type { ResourceSlot } from '../entities/ResourceSlot';
import type { Facility } from '../entities/Facility';
import type { Query } from './Query';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { getWorkerMultiplier, getFacilityMultiplier } from '../systems/ResourceRateCalculator';
import { getEntityAs, isFacility } from '../primitives/EntityTypeGuards';

/**
 * Aggregate facility effect across all facilities of a given type
 * 
 * Sums a specific effect value from all facilities of the specified type.
 * For example, sum maxActiveMissions from all MissionCommand facilities.
 * 
 * @param facilityType Facility type (e.g., 'MissionCommand', 'Dormitory')
 * @param effectKey Effect key from getActiveEffects() (e.g., 'maxActiveMissions', 'rosterCap')
 * @returns Query that returns the sum of the effect across all matching facilities
 */
export function aggregateFacilityEffect(
	facilityType: string,
	effectKey: string
): Query<number> {
	return (state: GameState): number => {
		const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state)
			.filter(f => f.attributes.facilityType === facilityType);
		
		let total = 0;
		for (const facility of facilities) {
			const effects = facility.getActiveEffects();
			const effectValue = (effects as Record<string, unknown>)[effectKey];
			if (typeof effectValue === 'number') {
				total += effectValue;
			}
		}
		
		return total;
	};
}

/**
 * Get available slots for a specific facility
 * 
 * @param facilityId Facility ID to get slots for
 * @param state GameState
 * @returns Array of ResourceSlot entities for the facility
 */
export function getAvailableSlotsForFacility(
	facilityId: string,
	state: GameState
): ResourceSlot[] {
	const slots = EntityQueryBuilder.byType<ResourceSlot>('ResourceSlot')(state);
	return slots.filter(slot => slot.attributes.facilityId === facilityId);
}

/**
 * Get unassigned resource slots
 * 
 * @param state GameState
 * @returns Array of ResourceSlot entities with assigneeType === 'none'
 */
export function getUnassignedSlots(state: GameState): ResourceSlot[] {
	const slots = EntityQueryBuilder.byType<ResourceSlot>('ResourceSlot')(state);
	return slots.filter(slot => slot.attributes.assigneeType === 'none');
}

/**
 * Get slots that can accept adventurer assignments
 * 
 * @param state GameState
 * @returns Array of ResourceSlot entities that can have adventurers assigned
 */
export function getSlotsAcceptingAdventurers(state: GameState): ResourceSlot[] {
	const slots = EntityQueryBuilder.byType<ResourceSlot>('ResourceSlot')(state);
	return slots.filter(slot => 
		slot.attributes.assigneeType === 'none' || 
		slot.attributes.assigneeType === 'adventurer'
	);
}

/**
 * Get player-assigned resource slots (for "Odd Jobs")
 * 
 * @param state GameState
 * @returns Array of ResourceSlot entities with assigneeType === 'player'
 */
export function getPlayerAssignedSlots(state: GameState): ResourceSlot[] {
	const slots = EntityQueryBuilder.byType<ResourceSlot>('ResourceSlot')(state);
	return slots.filter(slot => slot.attributes.assigneeType === 'player');
}

/**
 * Check if "Odd Jobs" are available (player-assigned slots exist)
 * 
 * @param state GameState
 * @returns True if at least one player-assigned slot exists
 */
export function hasOddJobsAvailable(state: GameState): boolean {
	return getPlayerAssignedSlots(state).length > 0;
}

/**
 * Get total gold generation rate from player-assigned slots (Odd Jobs)
 * 
 * Applies the same multipliers used in SlotGenerationSystem:
 * - Worker multiplier (1.0 for player, 1.5 for adventurer)
 * - Facility multiplier (based on facility tier)
 * 
 * @param state GameState
 * @returns Total effective gold per minute from all player-assigned gold slots
 */
export function getOddJobsGoldRate(state: GameState): number {
	const playerSlots = getPlayerAssignedSlots(state);
	return playerSlots
		.filter(slot => slot.attributes.resourceType === 'gold')
		.reduce((total, slot) => {
			// Calculate effective rate using single source of truth
			const effectiveRatePerMinute = getSlotEffectiveRate(
				slot,
				slot.attributes.assigneeType as 'player' | 'adventurer',
				state
			);
			
		return total + effectiveRatePerMinute;
	}, 0);
}

/**
 * Get effective generation rate for a slot with a specific assignee type
 * 
 * Applies the same multipliers used in SlotGenerationSystem:
 * - Worker multiplier (1.0 for player, 1.5 for adventurer)
 * - Facility multiplier (based on facility tier)
 * 
 * @param slot ResourceSlot to calculate rate for
 * @param assigneeType Type of assignee ('player' or 'adventurer')
 * @param state GameState
 * @returns Effective generation rate per minute (0 if slot is unassigned or facility not found)
 */
export function getSlotEffectiveRate(
	slot: ResourceSlot,
	assigneeType: 'player' | 'adventurer',
	state: GameState
): number {
	// If slot is unassigned, return 0
	if (slot.attributes.assigneeType === 'none') {
		return 0;
	}

	// Get facility for multiplier calculation
	const facility = getEntityAs(state.entities, slot.attributes.facilityId, isFacility);
	if (!facility) {
		// Return 0 if facility not found (warning logged at infrastructure layer)
		return 0;
	}

	// Validate baseRatePerMinute
	const baseRate = slot.attributes.baseRatePerMinute;
	if (typeof baseRate !== 'number' || isNaN(baseRate)) {
		return 0; // Return 0 instead of NaN
	}

	// Calculate effective rate using same multipliers as SlotGenerationSystem
	const workerMultiplier = getWorkerMultiplier(assigneeType);
	const facilityMultiplier = getFacilityMultiplier(facility);
	
	// Validate multipliers
	if (typeof workerMultiplier !== 'number' || isNaN(workerMultiplier) ||
		typeof facilityMultiplier !== 'number' || isNaN(facilityMultiplier)) {
		return 0; // Return 0 if multipliers are invalid
	}
	
	const effectiveRate = baseRate * workerMultiplier * facilityMultiplier;
	
	// Ensure result is valid number
	return isNaN(effectiveRate) || !isFinite(effectiveRate) ? 0 : effectiveRate;
}

/**
 * Get training multiplier from Training Grounds facilities
 * 
 * Aggregates trainingMultiplier from all Training Grounds facilities.
 * Uses sum aggregation (multiple Training Grounds add their multipliers together).
 * 
 * @param state GameState
 * @returns Total training multiplier (1.0 if no Training Grounds exist)
 */
export function getTrainingMultiplier(state: GameState): number {
	const query = aggregateFacilityEffect('TrainingGrounds', 'trainingMultiplier');
	const total = query(state);
	// Return 1.0 if no Training Grounds exist (no multiplier)
	return total > 0 ? total : 1.0;
}

/**
 * Get resource generation rates from all assigned slots
 * 
 * Calculates effective generation rates per minute for all resource types
 * from all assigned resource slots (both player and adventurer assigned).
 * 
 * @param state GameState
 * @returns Record mapping resource type to rate per minute
 */
export function getResourceGenerationRates(state: GameState): Record<string, number> {
	const slots = EntityQueryBuilder.byType<ResourceSlot>('ResourceSlot')(state);
	const rates: Record<string, number> = {};
	
	for (const slot of slots) {
		// Skip unassigned slots
		if (slot.attributes.assigneeType === 'none') {
			continue;
		}
		
		const resourceType = slot.attributes.resourceType;
		
		// Skip durationModifier slots - they don't generate resources, they modify mission speed
		if (resourceType === 'durationModifier') {
			continue;
		}
		
		const assigneeType = slot.attributes.assigneeType;
		
		// Calculate effective rate using single source of truth
		const effectiveRatePerMinute = getSlotEffectiveRate(slot, assigneeType, state);
		
		// Skip NaN values
		if (isNaN(effectiveRatePerMinute)) {
			continue;
		}
		
		// Add to total for this resource type
		rates[resourceType] = (rates[resourceType] || 0) + effectiveRatePerMinute;
	}
	
	return rates;
}

