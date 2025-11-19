/**
 * Facility Effect Queries
 * 
 * Queries for aggregating facility effects and resource slot availability.
 * Aggregates getActiveEffects() across facilities of the same type.
 */

import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import type { ResourceSlot } from '../entities/ResourceSlot';
import type { Query } from './Query';
import { EntityQueryBuilder } from './EntityQueryBuilder';

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
 * @param state GameState
 * @returns Total gold per minute from all player-assigned gold slots
 */
export function getOddJobsGoldRate(state: GameState): number {
	const playerSlots = getPlayerAssignedSlots(state);
	return playerSlots
		.filter(slot => slot.attributes.resourceType === 'gold')
		.reduce((total, slot) => total + slot.attributes.baseRatePerMinute, 0);
}

