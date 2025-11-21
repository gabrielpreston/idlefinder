/**
 * Mission Slot Queries Tests - Mission slot capacity and availability queries
 */

import { describe, it, expect } from 'vitest';
import {
	getMaxMissionSlots,
	getActiveMissionCount,
	getAvailableMissionSlots,
	getMissionSlotCapacity
} from './MissionSlotQueries';
import { createTestGameState, createTestMission, createTestFacility } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';

describe('MissionSlotQueries', () => {
	describe('getMaxMissionSlots', () => {
		it('should return base capacity of 1 when no MissionCommand facilities exist', () => {
			const state = createTestGameState();
			expect(getMaxMissionSlots(state)).toBe(1);
		});

		it('should return base capacity plus tier bonus from MissionCommand', () => {
			const missionCommand = createTestFacility({ facilityType: 'MissionCommand', tier: 1 });
			const entities = new Map<string, Entity>([[missionCommand.id, missionCommand]]);
			const state = createTestGameState({ entities });

			// Base (1) + tier 1 bonus (1) = 2
			expect(getMaxMissionSlots(state)).toBe(2);
		});

		it('should sum tier bonuses from multiple MissionCommand facilities', () => {
			const missionCommand1 = createTestFacility({ facilityType: 'MissionCommand', tier: 1 });
			const missionCommand2 = createTestFacility({ facilityType: 'MissionCommand', tier: 2 });
			const entities = new Map<string, Entity>([
				[missionCommand1.id, missionCommand1],
				[missionCommand2.id, missionCommand2]
			]);
			const state = createTestGameState({ entities });

			// Base (1) + tier 1 bonus (1) + tier 2 bonus (2) = 4
			expect(getMaxMissionSlots(state)).toBe(4);
		});

		it('should add tier bonus even for tier 0 facilities', () => {
			const missionCommand = createTestFacility({ facilityType: 'MissionCommand', tier: 0 });
			const entities = new Map<string, Entity>([[missionCommand.id, missionCommand]]);
			const state = createTestGameState({ entities });

			// Base (1) + tier 0 bonus (0) = 1
			expect(getMaxMissionSlots(state)).toBe(1);
		});
	});

	describe('getActiveMissionCount', () => {
		it('should return 0 when no missions exist', () => {
			const state = createTestGameState();
			expect(getActiveMissionCount(state)).toBe(0);
		});

		it('should return count of InProgress missions', () => {
			const mission1 = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'Available' });
			const mission3 = createTestMission({ id: 'mission-3', state: 'InProgress' });
			const entities = new Map<string, Entity>([
				[mission1.id, mission1],
				[mission2.id, mission2],
				[mission3.id, mission3]
			]);
			const state = createTestGameState({ entities });

			expect(getActiveMissionCount(state)).toBe(2);
		});

		it('should not count Completed missions', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Completed' });
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const state = createTestGameState({ entities });

			expect(getActiveMissionCount(state)).toBe(0);
		});
	});

	describe('getAvailableMissionSlots', () => {
		it('should return max slots when no active missions', () => {
			const state = createTestGameState();
			expect(getAvailableMissionSlots(state)).toBe(1);
		});

		it('should return correct available slots', () => {
			const missionCommand = createTestFacility({ facilityType: 'MissionCommand', tier: 2 });
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const entities = new Map<string, Entity>([
				[missionCommand.id, missionCommand],
				[mission.id, mission]
			]);
			const state = createTestGameState({ entities });

			// Base (1) + tier 2 bonus (2) = 3 max, minus 1 active = 2 available
			expect(getAvailableMissionSlots(state)).toBe(2);
		});

		it('should return 0 when all slots are full', () => {
			const mission1 = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const entities = new Map<string, Entity>([[mission1.id, mission1]]);
			const state = createTestGameState({ entities });

			expect(getAvailableMissionSlots(state)).toBe(0);
		});

		it('should clamp to 0 when active exceeds max', () => {
			const mission1 = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'InProgress' });
			const entities = new Map<string, Entity>([
				[mission1.id, mission1],
				[mission2.id, mission2]
			]);
			const state = createTestGameState({ entities });

			// Max is 1, but we have 2 active
			expect(getAvailableMissionSlots(state)).toBe(0);
		});
	});

	describe('getMissionSlotCapacity', () => {
		it('should return capacity object with correct values', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const state = createTestGameState({ entities });

			const capacity = getMissionSlotCapacity(state);

			expect(capacity.current).toBe(1);
			expect(capacity.max).toBe(1);
			expect(capacity.available).toBe(0);
			expect(capacity.utilization).toBe(1);
		});

		it('should return capacity with correct utilization', () => {
			const missionCommand = createTestFacility({ facilityType: 'MissionCommand', tier: 3 });
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const entities = new Map<string, Entity>([
				[missionCommand.id, missionCommand],
				[mission.id, mission]
			]);
			const state = createTestGameState({ entities });

			const capacity = getMissionSlotCapacity(state);

			// Base (1) + tier 3 bonus (3) = 4 max
			expect(capacity.current).toBe(1);
			expect(capacity.max).toBe(4);
			expect(capacity.available).toBe(3);
			expect(capacity.utilization).toBeCloseTo(0.25, 1);
		});
	});
});

