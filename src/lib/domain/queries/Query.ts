/**
 * Query System - Core query types and context helpers
 * 
 * Provides pure function query types for reading GameState without side effects.
 * Reuses RequirementContext for queries that need entities, resources, and time.
 */

import type { GameState } from '../entities/GameState';
import type { RequirementContext } from '../primitives/Requirement';
import type { Timestamp } from '../valueObjects/Timestamp';

/**
 * Query type - Pure function that reads from GameState
 * 
 * @template T The type of value returned by the query
 */
export type Query<T> = (state: GameState) => T;

/**
 * Query with time - For queries that need current time
 * 
 * @template T The type of value returned by the query
 */
export type QueryWithTime<T> = (state: GameState, time: Timestamp) => T;

/**
 * Create RequirementContext from GameState and Timestamp
 * 
 * Reuses existing RequirementContext structure for queries that need
 * entities, resources, and current time.
 * 
 * @param state GameState to convert
 * @param time Current time for the query
 * @returns RequirementContext with entities, resources, and currentTime
 */
export function createQueryContext(
	state: GameState,
	time: Timestamp
): RequirementContext {
	return {
		entities: state.entities,
		resources: state.resources,
		currentTime: time
	};
}

