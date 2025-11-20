/**
 * Capacity Query Builder Tests - Capacity query creation
 */

import { describe, it, expect } from 'vitest';
import { CapacityQueryBuilder } from './CapacityQueryBuilder';
import type { Query } from './Query';
import { createTestGameState } from '../../test-utils/testFactories';

describe('CapacityQueryBuilder', () => {
	describe('create', () => {
		it('should create capacity query with correct values', () => {
			const getMax: Query<number> = () => 10;
			const getCurrent: Query<number> = () => 3;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.current).toBe(3);
			expect(capacity.max).toBe(10);
			expect(capacity.available).toBe(7);
			expect(capacity.utilization).toBe(0.3);
		});

		it('should calculate available capacity correctly', () => {
			const getMax: Query<number> = () => 5;
			const getCurrent: Query<number> = () => 2;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.available).toBe(3);
		});

		it('should clamp available to zero when current exceeds max', () => {
			const getMax: Query<number> = () => 5;
			const getCurrent: Query<number> = () => 10;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.available).toBe(0);
		});

		it('should calculate utilization correctly', () => {
			const getMax: Query<number> = () => 20;
			const getCurrent: Query<number> = () => 15;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.utilization).toBe(0.75);
		});

		it('should return zero utilization when max is zero', () => {
			const getMax: Query<number> = () => 0;
			const getCurrent: Query<number> = () => 5;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.utilization).toBe(0);
		});

		it('should handle full capacity', () => {
			const getMax: Query<number> = () => 10;
			const getCurrent: Query<number> = () => 10;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.current).toBe(10);
			expect(capacity.max).toBe(10);
			expect(capacity.available).toBe(0);
			expect(capacity.utilization).toBe(1);
		});

		it('should handle empty capacity', () => {
			const getMax: Query<number> = () => 10;
			const getCurrent: Query<number> = () => 0;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.current).toBe(0);
			expect(capacity.max).toBe(10);
			expect(capacity.available).toBe(10);
			expect(capacity.utilization).toBe(0);
		});

		it('should use queries that read from GameState', () => {
			const getMax: Query<number> = (state) => state.entities.size + 5;
			const getCurrent: Query<number> = (state) => state.entities.size;

			const capacityQuery = CapacityQueryBuilder.create(getMax, getCurrent);
			const state = createTestGameState();

			const capacity = capacityQuery(state);

			expect(capacity.max).toBe(state.entities.size + 5);
			expect(capacity.current).toBe(state.entities.size);
		});
	});
});

