/**
 * Roster Queries Tests - Roster capacity and recruitment queries
 */

import { describe, it, expect } from 'vitest';
import {
	getMaxRosterCapacity,
	getCurrentRosterSize,
	canRecruit,
	getAvailableRosterSlots,
	getRosterCapacity
} from './RosterQueries';
import { createTestGameState, createTestAdventurer, createTestFacility } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';

describe('RosterQueries', () => {
	describe('getMaxRosterCapacity', () => {
		it('should return base capacity of 5 when no dormitories exist', () => {
			const state = createTestGameState();
			expect(getMaxRosterCapacity(state)).toBe(5);
		});

		it('should return capacity from dormitory effects', () => {
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			// Mock getActiveEffects to return rosterCap
			dormitory.getActiveEffects = () => ({ rosterCap: 10 });
			const entities = new Map<string, Entity>([[dormitory.id, dormitory]]);
			const state = createTestGameState({ entities });

			expect(getMaxRosterCapacity(state)).toBe(10);
		});

		it('should use base capacity when dormitory has no rosterCap effect', () => {
			const dormitory = createTestFacility({ facilityType: 'Dormitory' });
			dormitory.getActiveEffects = () => ({});
			const entities = new Map<string, Entity>([[dormitory.id, dormitory]]);
			const state = createTestGameState({ entities });

			expect(getMaxRosterCapacity(state)).toBe(5);
		});
	});

	describe('getCurrentRosterSize', () => {
		it('should return 0 when no adventurers exist', () => {
			const state = createTestGameState();
			expect(getCurrentRosterSize(state)).toBe(0);
		});

		it('should return correct count for multiple adventurers', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2]
			]);
			const state = createTestGameState({ entities });

			expect(getCurrentRosterSize(state)).toBe(2);
		});
	});

	describe('canRecruit', () => {
		it('should return true when roster has available slots', () => {
			const state = createTestGameState();
			// Base capacity is 5, no adventurers
			expect(canRecruit(state)).toBe(true);
		});

		it('should return false when roster is full', () => {
			const adventurers = Array.from({ length: 5 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			const entities = new Map<string, Entity>(
				adventurers.map(adv => [adv.id, adv])
			);
			const state = createTestGameState({ entities });

			expect(canRecruit(state)).toBe(false);
		});

		it('should return true when below capacity', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			expect(canRecruit(state)).toBe(true);
		});
	});

	describe('getAvailableRosterSlots', () => {
		it('should return max capacity when no adventurers exist', () => {
			const state = createTestGameState();
			expect(getAvailableRosterSlots(state)).toBe(5);
		});

		it('should return correct available slots', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			expect(getAvailableRosterSlots(state)).toBe(4);
		});

		it('should return 0 when roster is full', () => {
			const adventurers = Array.from({ length: 5 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			const entities = new Map<string, Entity>(
				adventurers.map(adv => [adv.id, adv])
			);
			const state = createTestGameState({ entities });

			expect(getAvailableRosterSlots(state)).toBe(0);
		});

		it('should clamp to 0 when current exceeds max', () => {
			const dormitory = createTestFacility({ facilityType: 'Dormitory' });
			dormitory.getActiveEffects = () => ({ rosterCap: 3 });
			const adventurers = Array.from({ length: 5 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			const entities = new Map<string, Entity>([
				[dormitory.id, dormitory],
				...adventurers.map(adv => [adv.id, adv] as [string, Entity])
			]);
			const state = createTestGameState({ entities });

			expect(getAvailableRosterSlots(state)).toBe(0);
		});
	});

	describe('getRosterCapacity', () => {
		it('should return capacity object with correct values', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			const capacity = getRosterCapacity(state);

			expect(capacity.current).toBe(1);
			expect(capacity.max).toBe(5);
			expect(capacity.available).toBe(4);
			expect(capacity.utilization).toBeCloseTo(0.2, 1);
		});

		it('should return capacity with utilization calculation', () => {
			const adventurers = Array.from({ length: 3 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			const entities = new Map<string, Entity>(
				adventurers.map(adv => [adv.id, adv])
			);
			const state = createTestGameState({ entities });

			const capacity = getRosterCapacity(state);

			expect(capacity.current).toBe(3);
			expect(capacity.max).toBe(5);
			expect(capacity.utilization).toBeCloseTo(0.6, 1);
		});
	});
});

