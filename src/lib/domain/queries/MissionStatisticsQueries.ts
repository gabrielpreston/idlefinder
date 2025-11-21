/**
 * Mission Statistics Queries
 * 
 * Queries for mission statistics, filtering, and assigned adventurer lookup.
 * Composes EntityQueryBuilder for mission filtering and statistics.
 */

import type { GameState } from '../entities/GameState';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';
import type { MissionState } from '../states/MissionState';
import type { MissionAttributes } from '../attributes/MissionAttributes';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import { getTimer } from '../primitives/TimerHelpers';

/**
 * Mission statistics interface
 */
export interface MissionStatistics {
	available: number;
	inProgress: number;
	completed: number;
	expired: number;
	total: number;
}

/**
 * Get overall mission statistics
 * 
 * @param state GameState
 * @returns MissionStatistics object with counts by state
 */
export function getMissionStatistics(state: GameState): MissionStatistics {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	
	return {
		available: missions.filter(m => m.state === 'Available').length,
		inProgress: missions.filter(m => m.state === 'InProgress').length,
		completed: missions.filter(m => m.state === 'Completed').length,
		expired: missions.filter(m => m.state === 'Expired').length,
		total: missions.length
	};
}

/**
 * Get missions filtered by state
 * 
 * @param state GameState
 * @param missionState MissionState to filter by
 * @returns Array of Mission entities in the specified state
 */
export function getMissionsByState(state: GameState, missionState: MissionState): Mission[] {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	return missions.filter(m => m.state === missionState);
}

/**
 * Get missions filtered by type
 * 
 * @param state GameState
 * @param missionType Mission type to filter by
 * @returns Array of Mission entities of the specified type
 */
export function getMissionsByType(
	state: GameState,
	missionType: MissionAttributes['missionType']
): Mission[] {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	return missions.filter(m => m.attributes.missionType === missionType);
}

/**
 * Get recent completed missions
 * 
 * @param state GameState
 * @param limit Maximum number of missions to return
 * @returns Array of recently completed Mission entities, sorted by completion time (most recent first)
 */
export function getRecentCompletions(state: GameState, limit: number = 10): Mission[] {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	const completed = missions.filter(m => m.state === 'Completed');
	
	// Sort by completedAt timer (most recent first)
	completed.sort((a, b) => {
		const aCompleted = a.timers['completedAt'];
		const bCompleted = b.timers['completedAt'];
		
		// Handle null/undefined cases
		if (!aCompleted && !bCompleted) return 0;
		if (!aCompleted) return 1; // a has no completion time, put it last
		if (!bCompleted) return -1; // b has no completion time, put it last
		
		// Both have completion times, sort descending (most recent first)
		return bCompleted - aCompleted;
	});
	
	return completed.slice(0, limit);
}

/**
 * Get adventurers assigned to a specific mission
 * 
 * @param state GameState
 * @param missionId Mission ID to find assigned adventurers for
 * @returns Array of Adventurer entities assigned to the mission
 */
export function getAssignedAdventurersForMission(
	state: GameState,
	missionId: string
): Adventurer[] {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.filter(
		a => a.state === 'OnMission' && a.metadata.currentMissionId === missionId
	);
}

/**
 * Get display duration for a mission in milliseconds
 * 
 * Unified query function that handles the overlap between timer system and duration system:
 * - For InProgress missions: returns endsAt - startedAt (using TimerHelpers)
 * - For Available/other states: returns baseDuration (using Duration value object)
 * 
 * This provides a single source of truth for mission duration display.
 * 
 * @param mission Mission entity
 * @returns Duration in milliseconds
 */
export function getMissionDisplayDuration(mission: Mission): number {
	if (mission.state === 'InProgress') {
		const startedAt = getTimer(mission, 'startedAt');
		const endsAt = getTimer(mission, 'endsAt');
		
		// Only use timer-based duration if both timers are valid and endsAt > startedAt
		if (startedAt && endsAt && endsAt.value > startedAt.value) {
			return endsAt.value - startedAt.value;
		}
	}
	
	// Fallback to baseDuration for Available or other states, or if timers are invalid
	return mission.attributes.baseDuration.toMilliseconds();
}

