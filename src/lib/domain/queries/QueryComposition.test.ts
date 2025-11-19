/**
 * Query Composition Tests - Utilities for composing and combining queries
 */

import { describe, it, expect } from 'vitest';
import { composeQueries, combineQueries } from './QueryComposition';
import type { Query } from './Query';
import { createTestGameState } from '../../test-utils/testFactories';
import type { GameState } from '../entities/GameState';

describe('QueryComposition', () => {
	describe('composeQueries', () => {
		it('should compose two queries correctly', () => {
			const query1: Query<number> = (state) => state.entities.size;
			const query2 = (count: number) => count * 2;

			const composed = composeQueries(query1, query2);
			const state = createTestGameState();

			const result = composed(state);

			expect(result).toBe(state.entities.size * 2);
		});

		it('should handle query that returns array', () => {
			const query1: Query<number[]> = (state) => [1, 2, 3];
			const query2 = (arr: number[]) => arr.length;

			const composed = composeQueries(query1, query2);
			const state = createTestGameState();

			const result = composed(state);

			expect(result).toBe(3);
		});

		it('should handle query that returns object', () => {
			const query1: Query<{ count: number }> = (state) => ({ count: state.entities.size });
			const query2 = (obj: { count: number }) => obj.count * 10;

			const composed = composeQueries(query1, query2);
			const state = createTestGameState();

			const result = composed(state);

			expect(result).toBe(state.entities.size * 10);
		});

		it('should execute queries in correct order', () => {
			let executionOrder: string[] = [];
			const query1: Query<number> = (state) => {
				executionOrder.push('query1');
				return 5;
			};
			const query2 = (value: number) => {
				executionOrder.push('query2');
				return value + 1;
			};

			const composed = composeQueries(query1, query2);
			const state = createTestGameState();

			composed(state);

			expect(executionOrder).toEqual(['query1', 'query2']);
		});
	});

	describe('combineQueries', () => {
		it('should combine two queries correctly', () => {
			const query1: Query<number> = (state) => state.entities.size;
			const query2: Query<number> = (state) => 10;
			const combine = (a: number, b: number) => a + b;

			const combined = combineQueries(query1, query2, combine);
			const state = createTestGameState();

			const result = combined(state);

			expect(result).toBe(state.entities.size + 10);
		});

		it('should combine queries with different return types', () => {
			const query1: Query<number> = (state) => state.entities.size;
			const query2: Query<string> = () => 'test';
			const combine = (count: number, str: string) => `${str}:${count}`;

			const combined = combineQueries(query1, query2, combine);
			const state = createTestGameState();

			const result = combined(state);

			expect(result).toBe(`test:${state.entities.size}`);
		});

		it('should execute both queries on same state', () => {
			let query1Called = false;
			let query2Called = false;
			const query1: Query<number> = (state) => {
				query1Called = true;
				return state.entities.size;
			};
			const query2: Query<number> = (state) => {
				query2Called = true;
				return 5;
			};
			const combine = (a: number, b: number) => a + b;

			const combined = combineQueries(query1, query2, combine);
			const state = createTestGameState();

			combined(state);

			expect(query1Called).toBe(true);
			expect(query2Called).toBe(true);
		});

		it('should handle combine function that returns object', () => {
			const query1: Query<number> = () => 3;
			const query2: Query<number> = () => 4;
			const combine = (a: number, b: number) => ({ sum: a + b, product: a * b });

			const combined = combineQueries(query1, query2, combine);
			const state = createTestGameState();

			const result = combined(state);

			expect(result).toEqual({ sum: 7, product: 12 });
		});
	});
});

