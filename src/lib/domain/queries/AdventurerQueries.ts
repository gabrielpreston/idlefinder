/**
 * Adventurer Queries
 * 
 * Queries for adventurer count and detection.
 */

import type { GameState } from '../entities/GameState';
import { EntityQueryBuilder } from './EntityQueryBuilder';
import type { Adventurer } from '../entities/Adventurer';

/**
 * Get adventurer count
 * 
 * @param state GameState
 * @returns Number of Adventurer entities
 */
export function getAdventurerCount(state: GameState): number {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.length;
}

/**
 * Check if any adventurers exist
 * 
 * @param state GameState
 * @returns True if at least one adventurer exists
 */
export function hasAnyAdventurers(state: GameState): boolean {
	return getAdventurerCount(state) > 0;
}

/**
 * Check if this is the first adventurer (exactly one)
 * 
 * @param state GameState
 * @returns True if exactly one adventurer exists
 */
export function isFirstAdventurer(state: GameState): boolean {
	return getAdventurerCount(state) === 1;
}

