/**
 * Query Composition Utilities
 * 
 * Utilities for composing and combining queries to build complex queries from simple ones.
 */

import type { GameState } from '../entities/GameState';
import type { Query } from './Query';

/**
 * Compose two queries: query2(query1(state))
 * 
 * @template T First query result type
 * @template U Second query result type
 * @param query1 First query to execute
 * @param query2 Second query that takes first query's result
 * @returns Composed query
 */
export function composeQueries<T, U>(
	query1: Query<T>,
	query2: (t: T) => U
): Query<U> {
	return (state: GameState): U => {
		const result1 = query1(state);
		return query2(result1);
	};
}

/**
 * Combine two queries into one
 * 
 * @template T First query result type
 * @template U Second query result type
 * @template V Combined result type
 * @param query1 First query
 * @param query2 Second query
 * @param combine Function to combine results
 * @returns Combined query
 */
export function combineQueries<T, U, V>(
	query1: Query<T>,
	query2: Query<U>,
	combine: (t: T, u: U) => V
): Query<V> {
	return (state: GameState): V => {
		const result1 = query1(state);
		const result2 = query2(state);
		return combine(result1, result2);
	};
}

