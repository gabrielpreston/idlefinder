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
import type { Facility } from '../entities/Facility';
// Import gating module to ensure gates are registered
import '../gating';

describe('RosterQueries', () => {
	describe('getMaxRosterCapacity', () => {
		it('should return 0 when no gates are unlocked (Guild Hall tier 0)', () => {
			const state = createTestGameState();
			// Guild Hall starts at tier 0, so no roster capacity gates are unlocked
			expect(getMaxRosterCapacity(state)).toBe(0);
		});

		it('should return 1 when Guild Hall is tier 1 (roster_capacity_1 unlocked)', () => {
			const state = createTestGameState();
			// Upgrade Guild Hall to tier 1 to unlock roster_capacity_1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade(); // Upgrades from tier 0 to tier 1

			expect(getMaxRosterCapacity(state)).toBe(1);
		});

		it('should return 2 when Dormitory is built (both gates unlocked)', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			// Merge entities: start with base entities, add Dormitory
			const entities = new Map(baseState.entities);
			entities.set(dormitory.id, dormitory);
			const state = createTestGameState({ entities });
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			// Base capacity: 2 (both gates unlocked) + Dormitory tier 1 bonus (5) = 7
			expect(getMaxRosterCapacity(state)).toBe(7);
		});

		it('should add Dormitory tier bonuses on top of base capacity', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 2 });
			// Merge entities: start with base entities, add Dormitory
			const entities = new Map(baseState.entities);
			entities.set(dormitory.id, dormitory);
			const state = createTestGameState({ entities });
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			// Base capacity: 2 (both gates unlocked) + Dormitory tier 2 bonus (10) = 12
			expect(getMaxRosterCapacity(state)).toBe(12);
		});

		it('should sum tier bonuses from multiple Dormitories', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			const dormitory1 = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			const dormitory2 = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			// Merge entities: start with base entities, add Dormitories
			const entities = new Map(baseState.entities);
			entities.set(dormitory1.id, dormitory1);
			entities.set(dormitory2.id, dormitory2);
			const state = createTestGameState({ entities });
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			// Base capacity: 2 (both gates unlocked) + Dormitory tier 1 bonus (5) + Dormitory tier 1 bonus (5) = 12
			expect(getMaxRosterCapacity(state)).toBe(12);
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
		it('should return false when no gates are unlocked (capacity 0)', () => {
			const state = createTestGameState();
			// Guild Hall tier 0, no gates unlocked, capacity is 0
			expect(canRecruit(state)).toBe(false);
		});

		it('should return true when Guild Hall tier 1 (capacity 1, no adventurers)', () => {
			const state = createTestGameState();
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			// Base capacity is 1, no adventurers
			expect(canRecruit(state)).toBe(true);
		});

		it('should return false when roster is full', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			// Upgrade Guild Hall to tier 1
			const baseGuildhall = Array.from(baseState.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			baseGuildhall.upgrade();

			// Create 1 adventurer (capacity is 1)
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			// Merge entities: start with base entities (which now has upgraded Guild Hall), add adventurer
			const entities = new Map(baseState.entities);
			entities.set(adventurer.id, adventurer);
			const stateWithAdventurer = createTestGameState({ entities });

			expect(canRecruit(stateWithAdventurer)).toBe(false);
		});

		it('should return true when below capacity', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			// Merge entities: start with base entities, add Dormitory
			const entities = new Map(baseState.entities);
			entities.set(dormitory.id, dormitory);
			const state = createTestGameState({ entities });
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			// Capacity is 2 (base) + 5 (Dormitory tier 1) = 7, no adventurers
			expect(canRecruit(state)).toBe(true);
		});
	});

	describe('getAvailableRosterSlots', () => {
		it('should return 0 when no gates are unlocked (capacity 0)', () => {
			const state = createTestGameState();
			// Guild Hall tier 0, no gates unlocked
			expect(getAvailableRosterSlots(state)).toBe(0);
		});

		it('should return max capacity when no adventurers exist (Guild Hall tier 1)', () => {
			const state = createTestGameState();
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			// Capacity is 1, no adventurers
			expect(getAvailableRosterSlots(state)).toBe(1);
		});

		it('should return correct available slots', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			// Upgrade Guild Hall to tier 1
			const baseGuildhall = Array.from(baseState.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			baseGuildhall.upgrade();

			// Create 1 adventurer
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			// Merge entities: start with base entities (which now has upgraded Guild Hall), add adventurer
			const entities = new Map(baseState.entities);
			entities.set(adventurer.id, adventurer);
			const stateWithAdventurer = createTestGameState({ entities });

			// Capacity is 1, 1 adventurer, so 0 available
			expect(getAvailableRosterSlots(stateWithAdventurer)).toBe(0);
		});

		it('should return 0 when roster is full', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			// Upgrade Guild Hall to tier 1
			const baseGuildhall = Array.from(baseState.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			baseGuildhall.upgrade();

			// Capacity is 2 (base) + 5 (Dormitory tier 1) = 7
			// Create 7 adventurers
			const adventurers = Array.from({ length: 7 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			// Merge entities: start with base entities (which now has upgraded Guild Hall), add Dormitory and adventurers
			const entities = new Map(baseState.entities);
			entities.set(dormitory.id, dormitory);
			adventurers.forEach(adv => entities.set(adv.id, adv));
			const stateFull = createTestGameState({ entities });

			expect(getAvailableRosterSlots(stateFull)).toBe(0);
		});

		it('should clamp to 0 when current exceeds max', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			// Upgrade Guild Hall to tier 1
			const baseGuildhall = Array.from(baseState.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			baseGuildhall.upgrade();

			// Capacity is 1, but create 2 adventurers
			const adventurers = Array.from({ length: 2 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			// Merge entities: start with base entities (which now has upgraded Guild Hall), add adventurers
			const entities = new Map(baseState.entities);
			adventurers.forEach(adv => entities.set(adv.id, adv));
			const stateWithExcess = createTestGameState({ entities });

			expect(getAvailableRosterSlots(stateWithExcess)).toBe(0);
		});
	});

	describe('getRosterCapacity', () => {
		it('should return capacity object with correct values (Guild Hall tier 1)', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			// Upgrade Guild Hall to tier 1
			const baseGuildhall = Array.from(baseState.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			baseGuildhall.upgrade();

			// Create 1 adventurer
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			// Merge entities: start with base entities (which now has upgraded Guild Hall), add adventurer
			const entities = new Map(baseState.entities);
			entities.set(adventurer.id, adventurer);
			const state = createTestGameState({ entities });

			const capacity = getRosterCapacity(state);

			expect(capacity.current).toBe(1);
			expect(capacity.max).toBe(1);
			expect(capacity.available).toBe(0);
			expect(capacity.utilization).toBe(1);
		});

		it('should return capacity with utilization calculation (Dormitory built)', () => {
			// Create base state first to get Guild Hall
			const baseState = createTestGameState();
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			const adventurers = Array.from({ length: 3 }, (_, i) => 
				createTestAdventurer({ id: `adv-${i}` })
			);
			// Merge entities: start with base entities, add Dormitory and adventurers
			const entities = new Map(baseState.entities);
			entities.set(dormitory.id, dormitory);
			adventurers.forEach(adv => entities.set(adv.id, adv));
			const state = createTestGameState({ entities });
			// Upgrade Guild Hall to tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade();

			const capacity = getRosterCapacity(state);

			// Capacity: 2 (base) + 5 (Dormitory tier 1) = 7
			expect(capacity.current).toBe(3);
			expect(capacity.max).toBe(7);
			expect(capacity.available).toBe(4);
			expect(capacity.utilization).toBeCloseTo(0.429, 2);
		});
	});
});

