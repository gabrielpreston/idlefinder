/**
 * Entity Test Helpers - Type-safe entity finding utilities for tests
 * Replaces repeated patterns: Array.from(state.entities.values()).filter(...) as Type
 * Uses existing EntityQueryBuilder and type guards for consistency
 */

import type { GameState } from '../domain/entities/GameState';
import type { Facility } from '../domain/entities/Facility';
import type { Adventurer } from '../domain/entities/Adventurer';
import type { Mission } from '../domain/entities/Mission';
import type { MissionState } from '../domain/states/MissionState';
import { EntityQueryBuilder } from '../domain/queries/EntityQueryBuilder';
import { isAdventurer, requireEntityAs } from '../domain/primitives/EntityTypeGuards';
import { getGuildHall } from '../domain/queries/FacilityQueries';

/**
 * Find facility by type - throws if not found
 * @param state GameState
 * @param facilityType Facility type to find
 * @returns Facility entity
 * @throws Error if facility not found
 */
export function findFacilityByType(state: GameState, facilityType: string): Facility {
	const facilities = EntityQueryBuilder.byType<Facility>('Facility')(state);
	const facility = facilities.find(f => f.attributes.facilityType === facilityType);
	if (!facility) {
		throw new Error(`Facility of type "${facilityType}" not found in game state`);
	}
	return facility;
}

/**
 * Require Guildhall facility - throws if not found
 * Wraps existing getGuildHall() to provide throwing variant for tests
 * @param state GameState
 * @returns Guildhall Facility entity
 * @throws Error if Guildhall not found
 */
export function requireGuildHall(state: GameState): Facility {
	const guildhall = getGuildHall(state);
	if (!guildhall) {
		throw new Error('Guildhall facility not found in game state');
	}
	return guildhall;
}

/**
 * Find adventurer by name - throws if not found
 * @param state GameState
 * @param name Adventurer name to find
 * @returns Adventurer entity
 * @throws Error if adventurer not found
 */
export function findAdventurerByName(state: GameState, name: string): Adventurer {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	const adventurer = adventurers.find(a => a.metadata.name === name);
	if (!adventurer) {
		throw new Error(`Adventurer with name "${name}" not found in game state`);
	}
	return adventurer;
}

/**
 * Find adventurer by ID - throws if not found
 * Uses requireEntityAs for type safety
 * @param state GameState
 * @param id Adventurer ID to find
 * @returns Adventurer entity
 * @throws Error if adventurer not found or wrong type
 */
export function findAdventurerById(state: GameState, id: string): Adventurer {
	return requireEntityAs(state.entities, id, isAdventurer);
}

/**
 * Find all available missions
 * @param state GameState
 * @returns Array of Mission entities with state 'Available'
 */
export function findAvailableMissions(state: GameState): Mission[] {
	return findMissionsByState(state, 'Available');
}

/**
 * Find missions by state
 * Wraps existing getMissionsByState() for consistency in test helpers
 * @param state GameState
 * @param missionState Mission state to filter by
 * @returns Array of Mission entities in the specified state
 */
export function findMissionsByState(state: GameState, missionState: MissionState): Mission[] {
	const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
	return missions.filter(m => m.state === missionState);
}

/**
 * Get all adventurers
 * @param state GameState
 * @returns Array of all Adventurer entities
 */
export function getAllAdventurers(state: GameState): Adventurer[] {
	return EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
}

/**
 * Get all facilities
 * @param state GameState
 * @returns Array of all Facility entities
 */
export function getAllFacilities(state: GameState): Facility[] {
	return EntityQueryBuilder.byType<Facility>('Facility')(state);
}

