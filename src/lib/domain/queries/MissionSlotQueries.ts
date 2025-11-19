/**
 * Mission Slot Capacity Queries
 * 
 * Queries for mission slot capacity, usage, and availability.
 * Aggregates MissionCommand facility effects to determine max slots.
 */

import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import type { Mission } from '../entities/Mission';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { CapacityQueryBuilder } from './CapacityQueryBuilder';
import type { Capacity } from './Capacity';

/**
 * Get maximum mission slots from MissionCommand facilities
 * 
 * Aggregates maxActiveMissions from all MissionCommand facilities.
 * Base capacity is 1 (from Guildhall), plus MissionCommand tier bonuses.
 * 
 * @param state GameState
 * @returns Maximum number of concurrent missions
 */
export function getMaxMissionSlots(state: GameState): number {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	
	let maxSlots = 1; // Base capacity from Guildhall
	
	for (const facility of facilities) {
		if (facility.attributes.facilityType === 'MissionCommand') {
			const effects = facility.getActiveEffects();
			if (effects.maxActiveMissions !== undefined) {
				maxSlots = effects.maxActiveMissions;
			}
		}
	}
	
	return maxSlots;
}

/**
 * Get count of currently active missions
 * 
 * @param state GameState
 * @returns Number of missions in 'InProgress' state
 */
export function getActiveMissionCount(state: GameState): number {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	return missions.filter(m => m.state === 'InProgress').length;
}

/**
 * Get available mission slots
 * 
 * @param state GameState
 * @returns Number of available mission slots (max - active)
 */
export function getAvailableMissionSlots(state: GameState): number {
	const max = getMaxMissionSlots(state);
	const active = getActiveMissionCount(state);
	return Math.max(0, max - active);
}

/**
 * Get mission slot capacity information
 * 
 * @param state GameState
 * @returns Capacity object with current, max, available, and utilization
 */
export function getMissionSlotCapacity(state: GameState): Capacity {
	return CapacityQueryBuilder.create(
		getMaxMissionSlots,
		getActiveMissionCount
	)(state);
}

