/**
 * Roster Capacity Queries
 * 
 * Queries for roster capacity, size, and recruitment availability.
 * Aggregates Dormitory facility effects to determine max roster capacity.
 */

import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import type { Adventurer } from '../entities/Adventurer';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { CapacityQueryBuilder } from './CapacityQueryBuilder';
import type { Capacity } from './Capacity';

/**
 * Get maximum roster capacity from Dormitory facilities
 * 
 * Aggregates rosterCap from all Dormitory facilities.
 * Base capacity is typically 5, plus Dormitory tier bonuses.
 * 
 * @param state GameState
 * @returns Maximum roster size
 */
export function getMaxRosterCapacity(state: GameState): number {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	
	let maxCapacity = 5; // Base capacity
	
	for (const facility of facilities) {
		if (facility.attributes.facilityType === 'Dormitory') {
			const effects = facility.getActiveEffects();
			if (effects.rosterCap !== undefined) {
				maxCapacity = effects.rosterCap;
			}
		}
	}
	
	return maxCapacity;
}

/**
 * Get current roster size
 * 
 * @param state GameState
 * @returns Number of Adventurer entities
 */
export function getCurrentRosterSize(state: GameState): number {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.length;
}

/**
 * Check if recruitment is possible
 * 
 * @param state GameState
 * @returns True if roster has available slots for recruitment
 */
export function canRecruit(state: GameState): boolean {
	const max = getMaxRosterCapacity(state);
	const current = getCurrentRosterSize(state);
	return current < max;
}

/**
 * Get available roster slots
 * 
 * @param state GameState
 * @returns Number of available roster slots (max - current)
 */
export function getAvailableRosterSlots(state: GameState): number {
	const max = getMaxRosterCapacity(state);
	const current = getCurrentRosterSize(state);
	return Math.max(0, max - current);
}

/**
 * Get roster capacity information
 * 
 * @param state GameState
 * @returns Capacity object with current, max, available, and utilization
 */
export function getRosterCapacity(state: GameState): Capacity {
	return CapacityQueryBuilder.create(
		getMaxRosterCapacity,
		getCurrentRosterSize
	)(state);
}

