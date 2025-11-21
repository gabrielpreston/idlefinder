/**
 * Facility Effect Queries Tests - Facility effect aggregation and resource slot queries
 */

import { describe, it, expect } from 'vitest';
import {
	aggregateFacilityEffect,
	getAvailableSlotsForFacility,
	getUnassignedSlots,
	getSlotsAcceptingAdventurers,
	getPlayerAssignedSlots,
	hasOddJobsAvailable,
	getOddJobsGoldRate,
	getSlotEffectiveRate,
	getResourceGenerationRates
} from './FacilityEffectQueries';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import { ResourceSlot } from '../entities/ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import type { Entity } from '../primitives/Requirement';

function createTestResourceSlot(overrides?: {
	id?: string;
	facilityId?: string;
	resourceType?: 'gold' | 'materials' | 'durationModifier';
	assigneeType?: 'player' | 'adventurer' | 'none';
	baseRatePerMinute?: number;
}): ResourceSlot {
	const id = Identifier.from<'SlotId'>(overrides?.id || crypto.randomUUID());
	const attributes: ResourceSlotAttributes = {
		facilityId: overrides?.facilityId || 'facility-1',
		resourceType: overrides?.resourceType || 'gold',
		baseRatePerMinute: overrides?.baseRatePerMinute || 6,
		assigneeType: overrides?.assigneeType || 'none',
		assigneeId: null,
		fractionalAccumulator: 0
	};
	return new ResourceSlot(id, attributes, [], 'available', {}, {});
}

describe('FacilityEffectQueries', () => {
	describe('aggregateFacilityEffect', () => {
		it('should return 0 when no facilities of type exist', () => {
			const state = createTestGameState();
			const query = aggregateFacilityEffect('Dormitory', 'rosterCap');
			expect(query(state)).toBe(0);
		});

		it('should sum rosterCap from Dormitory facilities', () => {
			const dormitory1 = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			const dormitory2 = createTestFacility({ facilityType: 'Dormitory', tier: 2 });
			const entities = new Map<string, Entity>([
				[dormitory1.id, dormitory1],
				[dormitory2.id, dormitory2]
			]);
			const state = createTestGameState({ entities });

			const query = aggregateFacilityEffect('Dormitory', 'rosterCap');
			// Dormitory tier 1: baseCapacity (1) + tier (1) * 5 = 6
			// Dormitory tier 2: baseCapacity (1) + tier (2) * 5 = 11
			// Total: 6 + 11 = 17
			expect(query(state)).toBe(17);
		});

		it('should sum maxActiveMissions from MissionCommand facilities', () => {
			const missionCommand1 = createTestFacility({ facilityType: 'MissionCommand', tier: 1 });
			const missionCommand2 = createTestFacility({ facilityType: 'MissionCommand', tier: 2 });
			const entities = new Map<string, Entity>([
				[missionCommand1.id, missionCommand1],
				[missionCommand2.id, missionCommand2]
			]);
			const state = createTestGameState({ entities });

			const query = aggregateFacilityEffect('MissionCommand', 'maxActiveMissions');
			// MissionCommand tier 1: baseCapacity (1) + tier (1) = 2
			// MissionCommand tier 2: baseCapacity (1) + tier (2) = 3
			// Total: 2 + 3 = 5
			expect(query(state)).toBe(5);
		});

		it('should ignore facilities of different types', () => {
			const dormitory = createTestFacility({ facilityType: 'Dormitory', tier: 1 });
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([
				[dormitory.id, dormitory],
				[guildhall.id, guildhall]
			]);
			const state = createTestGameState({ entities });

			const query = aggregateFacilityEffect('Dormitory', 'rosterCap');
			// Only Dormitory should contribute
			expect(query(state)).toBe(6);
		});

		it('should return 0 for non-numeric effect values', () => {
			const trainingGrounds = createTestFacility({ facilityType: 'TrainingGrounds', tier: 1 });
			const entities = new Map<string, Entity>([[trainingGrounds.id, trainingGrounds]]);
			const state = createTestGameState({ entities });

			const query = aggregateFacilityEffect('TrainingGrounds', 'rosterCap');
			// TrainingGrounds doesn't have rosterCap, should return 0
			expect(query(state)).toBe(0);
		});
	});

	describe('getAvailableSlotsForFacility', () => {
		it('should return empty array when no slots for facility', () => {
			const state = createTestGameState();
			expect(getAvailableSlotsForFacility('facility-1', state)).toHaveLength(0);
		});

		it('should return slots for specific facility', () => {
			const facility = createTestFacility({ id: 'facility-1' });
			const slot1 = createTestResourceSlot({ id: 'slot-1', facilityId: 'facility-1' });
			const slot2 = createTestResourceSlot({ id: 'slot-2', facilityId: 'facility-1' });
			const slot3 = createTestResourceSlot({ id: 'slot-3', facilityId: 'facility-2' });
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[slot1.id, slot1],
				[slot2.id, slot2],
				[slot3.id, slot3]
			]);
			const state = createTestGameState({ entities });

			const slots = getAvailableSlotsForFacility('facility-1', state);
			expect(slots).toHaveLength(2);
			expect(slots.map(s => s.id)).toContain('slot-1');
			expect(slots.map(s => s.id)).toContain('slot-2');
		});
	});

	describe('getUnassignedSlots', () => {
		it('should return empty array when no unassigned slots', () => {
			const state = createTestGameState();
			expect(getUnassignedSlots(state)).toHaveLength(0);
		});

		it('should return slots with assigneeType none', () => {
			const slot1 = createTestResourceSlot({ id: 'slot-1', assigneeType: 'none' });
			const slot2 = createTestResourceSlot({ id: 'slot-2', assigneeType: 'player' });
			const slot3 = createTestResourceSlot({ id: 'slot-3', assigneeType: 'none' });
			const entities = new Map<string, Entity>([
				[slot1.id, slot1],
				[slot2.id, slot2],
				[slot3.id, slot3]
			]);
			const state = createTestGameState({ entities });

			const unassigned = getUnassignedSlots(state);
			expect(unassigned).toHaveLength(2);
			expect(unassigned.map(s => s.id)).toContain('slot-1');
			expect(unassigned.map(s => s.id)).toContain('slot-3');
		});
	});

	describe('getSlotsAcceptingAdventurers', () => {
		it('should return slots with assigneeType none or adventurer', () => {
			const slot1 = createTestResourceSlot({ id: 'slot-1', assigneeType: 'none' });
			const slot2 = createTestResourceSlot({ id: 'slot-2', assigneeType: 'adventurer' });
			const slot3 = createTestResourceSlot({ id: 'slot-3', assigneeType: 'player' });
			const entities = new Map<string, Entity>([
				[slot1.id, slot1],
				[slot2.id, slot2],
				[slot3.id, slot3]
			]);
			const state = createTestGameState({ entities });

			const accepting = getSlotsAcceptingAdventurers(state);
			expect(accepting).toHaveLength(2);
			expect(accepting.map(s => s.id)).toContain('slot-1');
			expect(accepting.map(s => s.id)).toContain('slot-2');
		});
	});

	describe('getPlayerAssignedSlots', () => {
		it('should return empty array when no player-assigned slots', () => {
			// Create state with no slots (initial state includes a player-assigned gold slot)
			const entities = new Map<string, Entity>();
			const state = createTestGameState({ entities });
			expect(getPlayerAssignedSlots(state)).toHaveLength(0);
		});

		it('should return slots with assigneeType player', () => {
			const slot1 = createTestResourceSlot({ id: 'slot-1', assigneeType: 'player' });
			const slot2 = createTestResourceSlot({ id: 'slot-2', assigneeType: 'adventurer' });
			const slot3 = createTestResourceSlot({ id: 'slot-3', assigneeType: 'player' });
			const entities = new Map<string, Entity>([
				[slot1.id, slot1],
				[slot2.id, slot2],
				[slot3.id, slot3]
			]);
			const state = createTestGameState({ entities });

			const playerSlots = getPlayerAssignedSlots(state);
			expect(playerSlots).toHaveLength(2);
			expect(playerSlots.map(s => s.id)).toContain('slot-1');
			expect(playerSlots.map(s => s.id)).toContain('slot-3');
		});
	});

	describe('hasOddJobsAvailable', () => {
		it('should return false when no player-assigned slots', () => {
			// Create state with no slots (initial state includes a player-assigned gold slot)
			const entities = new Map<string, Entity>();
			const state = createTestGameState({ entities });
			expect(hasOddJobsAvailable(state)).toBe(false);
		});

		it('should return true when player-assigned slots exist', () => {
			const slot = createTestResourceSlot({ assigneeType: 'player' });
			const entities = new Map<string, Entity>([[slot.id, slot]]);
			const state = createTestGameState({ entities });

			expect(hasOddJobsAvailable(state)).toBe(true);
		});
	});

	describe('getOddJobsGoldRate', () => {
		it('should return 0 when no player-assigned gold slots', () => {
			// Create state with no slots (initial state includes a gold slot)
			const entities = new Map<string, Entity>();
			const state = createTestGameState({ entities });
			expect(getOddJobsGoldRate(state)).toBe(0);
		});

		it('should sum effective gold rates from player-assigned gold slots with multipliers', () => {
			// Create facilities (tier 1 = multiplier 1.0)
			const facility1 = createTestFacility({ id: 'facility-1', tier: 1 });
			const facility2 = createTestFacility({ id: 'facility-2', tier: 1 });
			const facility3 = createTestFacility({ id: 'facility-3', tier: 1 });
			
			const goldSlot1 = createTestResourceSlot({ 
				id: 'slot-1',
				facilityId: 'facility-1',
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const goldSlot2 = createTestResourceSlot({ 
				id: 'slot-2',
				facilityId: 'facility-2',
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 10
			});
			const materialsSlot = createTestResourceSlot({ 
				id: 'slot-3',
				facilityId: 'facility-3',
				assigneeType: 'player', 
				resourceType: 'materials',
				baseRatePerMinute: 5
			});
			const entities = new Map<string, Entity>([
				[facility1.id, facility1],
				[facility2.id, facility2],
				[facility3.id, facility3],
				[goldSlot1.id, goldSlot1],
				[goldSlot2.id, goldSlot2],
				[materialsSlot.id, materialsSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 1: multiplier = 1.0, player multiplier = 1.0
			// Effective rate = base * 1.0 * 1.0 = base
			expect(getOddJobsGoldRate(state)).toBe(16); // 6 + 10, materials slot excluded
		});

		it('should apply tier 0 facility multiplier correctly', () => {
			// Create tier 0 facility (multiplier = 0.75)
			const facility = createTestFacility({ id: 'facility-1', tier: 0 });
			const playerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[playerSlot.id, playerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 0: multiplier = 0.75, player multiplier = 1.0
			// Effective rate = 6 * 1.0 * 0.75 = 4.5
			expect(getOddJobsGoldRate(state)).toBe(4.5);
		});

		it('should exclude non-player assigned slots', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const playerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const adventurerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'adventurer', 
				resourceType: 'gold',
				baseRatePerMinute: 10
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[playerSlot.id, playerSlot],
				[adventurerSlot.id, adventurerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 1: multiplier = 1.0, player multiplier = 1.0
			// Only player slot counts, adventurer slot excluded
			expect(getOddJobsGoldRate(state)).toBe(6);
		});
	});

	describe('getSlotEffectiveRate', () => {
		it('should return 0 when slot is unassigned', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const unassignedSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'none',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[unassignedSlot.id, unassignedSlot]
			]);
			const state = createTestGameState({ entities });

			expect(getSlotEffectiveRate(unassignedSlot, 'player', state)).toBe(0);
		});

		it('should calculate correct rate for player assignee with tier 1 facility', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const playerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'player',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[playerSlot.id, playerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 1: multiplier = 1.0, player multiplier = 1.0
			// Effective rate = 6 * 1.0 * 1.0 = 6
			expect(getSlotEffectiveRate(playerSlot, 'player', state)).toBe(6);
		});

		it('should calculate correct rate for adventurer assignee with tier 1 facility', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const adventurerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'adventurer',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[adventurerSlot.id, adventurerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 1: multiplier = 1.0, adventurer multiplier = 1.5
			// Effective rate = 6 * 1.5 * 1.0 = 9
			expect(getSlotEffectiveRate(adventurerSlot, 'adventurer', state)).toBe(9);
		});

		it('should apply tier 0 facility multiplier correctly', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 0 });
			const playerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'player',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[playerSlot.id, playerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 0: multiplier = 0.75, player multiplier = 1.0
			// Effective rate = 6 * 1.0 * 0.75 = 4.5
			expect(getSlotEffectiveRate(playerSlot, 'player', state)).toBe(4.5);
		});

		it('should apply tier 2 facility multiplier correctly', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 2 });
			const playerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'player',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[playerSlot.id, playerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 2: multiplier = 1.25, player multiplier = 1.0
			// Effective rate = 6 * 1.0 * 1.25 = 7.5
			expect(getSlotEffectiveRate(playerSlot, 'player', state)).toBe(7.5);
		});

		it('should apply tier 3 facility multiplier correctly', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 3 });
			const adventurerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'adventurer',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[adventurerSlot.id, adventurerSlot]
			]);
			const state = createTestGameState({ entities });

			// Tier 3: multiplier = 1.5, adventurer multiplier = 1.5
			// Effective rate = 6 * 1.5 * 1.5 = 13.5
			expect(getSlotEffectiveRate(adventurerSlot, 'adventurer', state)).toBe(13.5);
		});

		it('should return 0 when facility not found', () => {
			const slot = createTestResourceSlot({ 
				facilityId: 'nonexistent-facility',
				assigneeType: 'player',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[slot.id, slot]
			]);
			const state = createTestGameState({ entities });

			// Should return 0 and log warning when facility not found
			expect(getSlotEffectiveRate(slot, 'player', state)).toBe(0);
		});

		it('should calculate rate for different assignee type than slot current assignee', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const playerSlot = createTestResourceSlot({ 
				facilityId: 'facility-1',
				assigneeType: 'player',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[playerSlot.id, playerSlot]
			]);
			const state = createTestGameState({ entities });

			// Can calculate rate for adventurer even if slot is assigned to player
			// Tier 1: multiplier = 1.0, adventurer multiplier = 1.5
			// Effective rate = 6 * 1.5 * 1.0 = 9
			expect(getSlotEffectiveRate(playerSlot, 'adventurer', state)).toBe(9);
		});
	});

	describe('getResourceGenerationRates', () => {
		it('should exclude durationModifier slots from resource generation rates', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 1 });
			const goldSlot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const durationModifierSlot = createTestResourceSlot({
				facilityId: facility.id,
				assigneeType: 'player',
				resourceType: 'durationModifier',
				baseRatePerMinute: 1.0
			});
			const entities = new Map<string, Entity>([
				[facility.id, facility],
				[goldSlot.id, goldSlot],
				[durationModifierSlot.id, durationModifierSlot]
			]);
			const state = createTestGameState({ entities });

			const rates = getResourceGenerationRates(state);
			
			expect(rates).not.toHaveProperty('durationModifier');
			expect(rates).toHaveProperty('gold');
			expect(rates.gold).toBe(6); // Only gold slot should contribute
		});
	});
});

