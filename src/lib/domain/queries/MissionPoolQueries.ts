/**
 * Mission Pool Queries
 * 
 * Queries for mission pool adventurers (Idle + not assigned to slots).
 * Composes EntityQueryBuilder with slot assignment checks.
 */

import type { GameState } from '../entities/GameState';
import type { Adventurer } from '../entities/Adventurer';
import { EntityQueryBuilder } from './EntityQueryBuilder';

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

