/**
 * Mission Pool Queries
 * 
 * Queries for mission pool adventurers (Idle + not assigned to slots).
 * Also includes queries for mission pool management (available missions, expired missions, etc.).
 * Composes EntityQueryBuilder with slot assignment checks.
 */

import type { GameState } from '../entities/GameState';
import type { Adventurer } from '../entities/Adventurer';
import type { Mission } from '../entities/Mission';
import type { Timestamp } from '../valueObjects/Timestamp';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { getTimer } from '../primitives/TimerHelpers';
import { getUnlockedMissionTiers } from './UnlockQueries';
import { GameConfig } from '../config/GameConfig';
import { getWorkerMultiplier } from '../systems/ResourceRateCalculator';
import { getFacilitiesByType } from './FacilityQueries';
import { getAvailableSlotsForFacility } from './FacilityEffectQueries';
import type { ResourceSlot } from '../entities/ResourceSlot';

/**
 * Get adventurers available for mission pool
 * 
 * Returns adventurers that are:
 * - In 'Idle' state
 * - Not assigned to any resource slot (assignedSlotId === null)
 * 
 * @param state GameState
 * @returns Array of Adventurer entities available for missions
 */
export function getMissionPoolAdventurers(state: GameState): Adventurer[] {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.filter(adventurer => 
		adventurer.state === 'Idle' && 
		adventurer.attributes.assignedSlotId === null
	);
}

/**
 * Get adventurers assigned to resource slots
 * 
 * @param state GameState
 * @returns Array of Adventurer entities assigned to slots
 */
export function getAssignedAdventurers(state: GameState): Adventurer[] {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.filter(adventurer => 
		adventurer.attributes.assignedSlotId !== null
	);
}

/**
 * Get idle adventurers (regardless of slot assignment)
 * 
 * @param state GameState
 * @returns Array of Adventurer entities in 'Idle' state
 */
export function getIdleAdventurers(state: GameState): Adventurer[] {
	return EntityQueryBuilder.byState<Adventurer>('Idle')(state);
}

/**
 * Get count of available missions (missions in 'Available' state)
 * 
 * @param state GameState
 * @returns Number of missions with state === 'Available'
 */
export function getAvailableMissionCount(state: GameState): number {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	return missions.filter(m => m.state === 'Available').length;
}

/**
 * Get expired missions (Available missions with expiresAt < now)
 * 
 * @param state GameState
 * @param now Current timestamp
 * @returns Array of Mission entities that have expired
 */
export function getExpiredMissions(state: GameState, now: Timestamp): Mission[] {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	return missions.filter(mission => {
		if (mission.state !== 'Available') {
			return false;
		}
		const expiresAt = getTimer(mission, 'expiresAt');
		if (!expiresAt) {
			return false;
		}
		return now.value >= expiresAt.value;
	});
}

/**
 * Get target pool size based on unlocked tiers
 * 
 * @param state GameState
 * @returns Target number of available missions (tiers × targetPoolSizePerTier)
 */
export function getTargetPoolSize(state: GameState): number {
	const unlockedTiers = getUnlockedMissionTiers(state);
	return unlockedTiers.length * GameConfig.missionPool.targetPoolSizePerTier;
}

/**
 * Get effective mission generation cadence (in seconds) with speed multiplier
 * 
 * Applies worker multiplier to reduce cadence time (faster generation).
 * If adventurer is assigned (1.5x multiplier), cadence is reduced to 40s (from 60s).
 * 
 * @param state GameState
 * @returns Effective cadence in seconds (reduced if adventurer assigned)
 */
export function getEffectiveMissionGenerationCadence(state: GameState): number {
	// Find Mission Command facilities
	const missionCommandFacilities = getFacilitiesByType('MissionCommand', state);
	if (missionCommandFacilities.length === 0) {
		return GameConfig.missionPool.generationCadenceSeconds;
	}

	// Use first Mission Command facility
	const facility = missionCommandFacilities[0];

	// Find durationModifier slots for this facility
	const slots = getAvailableSlotsForFacility(facility.id, state)
		.filter((slot): slot is ResourceSlot => slot.attributes.resourceType === 'durationModifier');

	// Find assigned slot (if any)
	const assignedSlot = slots.find(slot => slot.attributes.assigneeType !== 'none');

	// Get worker multiplier (1.0 if no assignment, otherwise from slot)
	const workerMultiplier = assignedSlot 
		? getWorkerMultiplier(assignedSlot.attributes.assigneeType as 'player' | 'adventurer')
		: 1.0;
	
	// Apply speed multiplier: reduce cadence time
	return GameConfig.missionPool.generationCadenceSeconds / workerMultiplier;
}

