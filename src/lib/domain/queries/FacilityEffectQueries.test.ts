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
	getOddJobsGoldRate
} from './FacilityEffectQueries';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import { ResourceSlot } from '../entities/ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import type { Entity } from '../primitives/Requirement';

function createTestResourceSlot(overrides?: {
	id?: string;
	facilityId?: string;
	resourceType?: 'gold' | 'materials';
	assigneeType?: 'player' | 'adventurer' | 'none';
	baseRatePerMinute?: number;
}): ResourceSlot {
	const id = Identifier.from<'SlotId'>(overrides?.id || crypto.randomUUID());
	const attributes: ResourceSlotAttributes = {
		facilityId: overrides?.facilityId || 'facility-1',
		resourceType: overrides?.resourceType || 'gold',
		baseRatePerMinute: overrides?.baseRatePerMinute || 6,
		assigneeType: overrides?.assigneeType || 'none',
		assigneeId: null
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

		it('should sum gold rates from player-assigned gold slots', () => {
			const goldSlot1 = createTestResourceSlot({ 
				id: 'slot-1', 
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const goldSlot2 = createTestResourceSlot({ 
				id: 'slot-2', 
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 10
			});
			const materialsSlot = createTestResourceSlot({ 
				id: 'slot-3', 
				assigneeType: 'player', 
				resourceType: 'materials',
				baseRatePerMinute: 5
			});
			const entities = new Map<string, Entity>([
				[goldSlot1.id, goldSlot1],
				[goldSlot2.id, goldSlot2],
				[materialsSlot.id, materialsSlot]
			]);
			const state = createTestGameState({ entities });

			expect(getOddJobsGoldRate(state)).toBe(16); // 6 + 10, materials slot excluded
		});

		it('should exclude non-player assigned slots', () => {
			const playerSlot = createTestResourceSlot({ 
				assigneeType: 'player', 
				resourceType: 'gold',
				baseRatePerMinute: 6
			});
			const adventurerSlot = createTestResourceSlot({ 
				assigneeType: 'adventurer', 
				resourceType: 'gold',
				baseRatePerMinute: 10
			});
			const entities = new Map<string, Entity>([
				[playerSlot.id, playerSlot],
				[adventurerSlot.id, adventurerSlot]
			]);
			const state = createTestGameState({ entities });

			expect(getOddJobsGoldRate(state)).toBe(6);
		});
	});
});

