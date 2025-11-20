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
import { getWorkerMultiplier, getFacilityMultiplier } from '../systems/SlotGenerationSystem';
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
			// Get facility for multiplier calculation
			const facility = getEntityAs(state.entities, slot.attributes.facilityId, isFacility);
			if (!facility) {
				// Skip this slot if facility not found (warning logged at infrastructure layer)
				return total;
			}

			// Calculate effective rate using same multipliers as SlotGenerationSystem
			const workerMultiplier = getWorkerMultiplier(slot.attributes.assigneeType as 'player' | 'adventurer');
			const facilityMultiplier = getFacilityMultiplier(facility);
			const effectiveRatePerMinute = slot.attributes.baseRatePerMinute * workerMultiplier * facilityMultiplier;
			
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

	// Calculate effective rate using same multipliers as SlotGenerationSystem
	const workerMultiplier = getWorkerMultiplier(assigneeType);
	const facilityMultiplier = getFacilityMultiplier(facility);
	return slot.attributes.baseRatePerMinute * workerMultiplier * facilityMultiplier;
}

