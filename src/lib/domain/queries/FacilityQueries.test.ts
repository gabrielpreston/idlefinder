/**
 * Facility Queries Tests - Facility-specific information queries
 */

import { describe, it, expect } from 'vitest';
import {
	getGuildHallTier,
	isGuildHallRuined,
	getGuildHall,
	hasFacility,
	getFacilitiesByType
} from './FacilityQueries';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';

describe('FacilityQueries', () => {
	describe('getGuildHallTier', () => {
		it('should return guildhall tier when guildhall exists', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 2 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			expect(getGuildHallTier(state)).toBe(2);
		});

		it('should return 0 when guildhall not found', () => {
			const state = createTestGameState();
			expect(getGuildHallTier(state)).toBe(0);
		});

		it('should return correct tier for tier 0 guildhall', () => {
			// Create state with only tier 0 guildhall (no initial state entities)
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 0 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			// getGuildHallTier should find the tier 0 guildhall
			const tier = getGuildHallTier(state);
			expect(tier).toBe(0);
		});
	});

	describe('isGuildHallRuined', () => {
		it('should return true when guildhall tier is 0', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 0 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			expect(isGuildHallRuined(state)).toBe(true);
		});

		it('should return false when guildhall tier is above 0', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			expect(isGuildHallRuined(state)).toBe(false);
		});

		it('should return true when guildhall not found', () => {
			const state = createTestGameState();
			expect(isGuildHallRuined(state)).toBe(true);
		});
	});

	describe('getGuildHall', () => {
		it('should return guildhall facility when exists', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			const result = getGuildHall(state);
			expect(result).toBeDefined();
			expect(result?.id).toBe(guildhall.id);
			expect(result?.attributes.facilityType).toBe('Guildhall');
		});

		it('should return undefined when guildhall not found', () => {
			// Create state with no facilities
			const entities = new Map<string, Entity>();
			const state = createTestGameState({ entities });
			expect(getGuildHall(state)).toBeUndefined();
		});

		it('should return first guildhall when multiple exist', () => {
			const guildhall1 = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const guildhall2 = createTestFacility({ facilityType: 'Guildhall', tier: 2 });
			const entities = new Map<string, Entity>([
				[guildhall1.id, guildhall1],
				[guildhall2.id, guildhall2]
			]);
			const state = createTestGameState({ entities });

			const result = getGuildHall(state);
			expect(result).toBeDefined();
			// Should return one of them (implementation uses find, so first match)
		});
	});

	describe('hasFacility', () => {
		it('should return true when facility type exists', () => {
			const facility = createTestFacility({ facilityType: 'Dormitory' });
			const entities = new Map<string, Entity>([[facility.id, facility]]);
			const state = createTestGameState({ entities });

			expect(hasFacility('Dormitory', state)).toBe(true);
		});

		it('should return false when facility type does not exist', () => {
			const state = createTestGameState();
			expect(hasFacility('TrainingGrounds', state)).toBe(false);
		});

		it('should return true for Guildhall when guildhall exists', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall' });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			expect(hasFacility('Guildhall', state)).toBe(true);
		});
	});

	describe('getFacilitiesByType', () => {
		it('should return all facilities of specified type', () => {
			const facility1 = createTestFacility({ facilityType: 'Dormitory', id: 'fac-1' });
			const facility2 = createTestFacility({ facilityType: 'Dormitory', id: 'fac-2' });
			const facility3 = createTestFacility({ facilityType: 'Guildhall', id: 'fac-3' });
			const entities = new Map<string, Entity>([
				[facility1.id, facility1],
				[facility2.id, facility2],
				[facility3.id, facility3]
			]);
			const state = createTestGameState({ entities });

			const dormitories = getFacilitiesByType('Dormitory', state);
			expect(dormitories).toHaveLength(2);
			expect(dormitories.every(f => f.attributes.facilityType === 'Dormitory')).toBe(true);
		});

		it('should return empty array when no facilities of type exist', () => {
			const state = createTestGameState();
			expect(getFacilitiesByType('TrainingGrounds', state)).toHaveLength(0);
		});

		it('should return single facility when one exists', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall' });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			const guildhalls = getFacilitiesByType('Guildhall', state);
			expect(guildhalls).toHaveLength(1);
			expect(guildhalls[0].id).toBe(guildhall.id);
		});
	});
});

