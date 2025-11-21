/**
 * Recruit Pool Queries
 * 
 * Queries for recruit pool preview adventurers (state: 'Preview').
 * Composes EntityQueryBuilder with state filtering.
 */

import type { GameState } from '../entities/GameState';
import type { Adventurer } from '../entities/Adventurer';
import { EntityQueryBuilder } from './EntityQueryBuilder';

/**
 * Get recruit pool preview adventurers
 * 
 * Returns adventurers that are:
 * - In 'Preview' state
 * 
 * @param state GameState
 * @returns Array of Adventurer entities in preview pool
 */
export function getRecruitPool(state: GameState): Adventurer[] {
	const adventurers = EntityQueryBuilder.byType<Adventurer>('Adventurer')(state);
	return adventurers.filter(adventurer => adventurer.state === 'Preview');
}

