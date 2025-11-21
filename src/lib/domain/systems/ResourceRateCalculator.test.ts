/**
 * Resource Rate Calculator Tests
 */

import { describe, it, expect } from 'vitest';
import { getFacilityMultiplier, getWorkerMultiplier } from './ResourceRateCalculator';
import { createTestFacility } from '../../test-utils/testFactories';

describe('ResourceRateCalculator', () => {
	describe('getFacilityMultiplier', () => {
		it('should return 1.0 for tier 1', () => {
			const facility = createTestFacility({ tier: 1 });
			expect(getFacilityMultiplier(facility)).toBe(1.0);
		});

		it('should return 1.25 for tier 2', () => {
			const facility = createTestFacility({ tier: 2 });
			expect(getFacilityMultiplier(facility)).toBe(1.25);
		});

		it('should return 1.5 for tier 3', () => {
			const facility = createTestFacility({ tier: 3 });
			expect(getFacilityMultiplier(facility)).toBe(1.5);
		});

		it('should handle tier 0', () => {
			const facility = createTestFacility({ tier: 0 });
			// Formula: 1 + 0.25 * (tier - 1) = 1 + 0.25 * (-1) = 0.75
			const multiplier = getFacilityMultiplier(facility);
			expect(multiplier).toBe(0.75);
		});

		it('should handle higher tiers', () => {
			const facility = createTestFacility({ tier: 5 });
			// Formula: 1 + 0.25 * (5 - 1) = 1 + 1.0 = 2.0
			expect(getFacilityMultiplier(facility)).toBe(2.0);
		});
	});

	describe('getWorkerMultiplier', () => {
		it('should return 1.0 for player', () => {
			expect(getWorkerMultiplier('player')).toBe(1.0);
		});

		it('should return 1.5 for adventurer', () => {
			expect(getWorkerMultiplier('adventurer')).toBe(1.5);
		});
	});
});

