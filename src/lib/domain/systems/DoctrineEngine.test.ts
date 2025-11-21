/**
 * Doctrine Engine Tests - Mission allocation based on doctrine
 */

import { describe, it, expect } from 'vitest';
import { allocateMissionsByDoctrine } from './DoctrineEngine';
import { createTestMission, createTestAdventurer } from '../../test-utils/testFactories';
import { MissionDoctrine } from '../entities/MissionDoctrine';
import { Identifier } from '../valueObjects/Identifier';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';

function createTestDoctrine(overrides?: {
	focus?: 'gold' | 'xp' | 'materials' | 'balanced';
	riskTolerance?: 'low' | 'medium' | 'high';
	preferredMissionTypes?: string[];
}): MissionDoctrine {
	const id = Identifier.generate<'MissionDoctrineId'>();
	const doctrine = MissionDoctrine.createDefault(id);
	if (overrides?.focus) {
		doctrine.updateFocus(overrides.focus);
	}
	if (overrides?.riskTolerance) {
		doctrine.updateRiskTolerance(overrides.riskTolerance);
	}
	if (overrides?.preferredMissionTypes) {
		doctrine.attributes.preferredMissionTypes = overrides.preferredMissionTypes;
	}
	return doctrine;
}

describe('DoctrineEngine', () => {
	describe('allocateMissionsByDoctrine', () => {
		it('should return empty allocation when no missions available', () => {
			const missions: Mission[] = [];
			const adventurers = [createTestAdventurer({ id: 'adv-1' })];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(true);
			expect(result.getCount()).toBe(0);
		});

		it('should return empty allocation when no adventurers available', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurers: Adventurer[] = [];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(true);
			expect(result.getCount()).toBe(0);
		});

		it('should return empty allocation when maxAssignments is 0', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 0);

			expect(result.isEmpty()).toBe(true);
			expect(result.getCount()).toBe(0);
		});

		it('should allocate mission when missions and adventurers available', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			expect(result.getCount()).toBe(1);
			const assignments = result.getAssignments();
			expect(assignments[0].missionId).toBe('mission-1');
			expect(assignments[0].adventurerId).toBe('adv-1');
		});

		it('should filter missions by preferred mission types', () => {
			const combatMission = createTestMission({ id: 'mission-1' });
			combatMission.attributes.missionType = 'combat';
			const explorationMission = createTestMission({ id: 'mission-2' });
			explorationMission.attributes.missionType = 'exploration';
			const missions = [combatMission, explorationMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ preferredMissionTypes: ['combat'] });

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			const assignments = result.getAssignments();
			const allocatedMission = missions.find(m => m.id === assignments[0].missionId);
			expect(allocatedMission?.attributes.missionType).toBe('combat');
		});

		it('should return empty allocation when no missions match preferred types', () => {
			const mission = createTestMission({ id: 'mission-1' });
			mission.attributes.missionType = 'combat';
			const missions = [mission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ preferredMissionTypes: ['exploration'] });

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(true);
		});

		it('should prefer missions with higher gold rewards when focus is gold', () => {
			const lowGoldMission = createTestMission({ id: 'mission-1' });
			lowGoldMission.attributes.baseRewards = { gold: 10, xp: 20 };
			const highGoldMission = createTestMission({ id: 'mission-2' });
			highGoldMission.attributes.baseRewards = { gold: 100, xp: 5 };
			const missions = [lowGoldMission, highGoldMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ focus: 'gold' });

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			const assignments = result.getAssignments();
			expect(assignments[0].missionId).toBe('mission-2');
		});

		it('should prefer missions with higher XP rewards when focus is xp', () => {
			const lowXPMission = createTestMission({ id: 'mission-1' });
			lowXPMission.attributes.baseRewards = { gold: 100, xp: 5 };
			const highXPMission = createTestMission({ id: 'mission-2' });
			highXPMission.attributes.baseRewards = { gold: 10, xp: 50 };
			const missions = [lowXPMission, highXPMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ focus: 'xp' });

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			const assignments = result.getAssignments();
			expect(assignments[0].missionId).toBe('mission-2');
		});

		it('should prefer easier missions when risk tolerance is low', () => {
			const easyMission = createTestMission({ id: 'mission-1' });
			easyMission.attributes.dc = 10;
			const hardMission = createTestMission({ id: 'mission-2' });
			hardMission.attributes.dc = 20;
			const missions = [easyMission, hardMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ riskTolerance: 'low' });

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			const assignments = result.getAssignments();
			expect(assignments[0].missionId).toBe('mission-1');
		});

		it('should prefer harder missions when risk tolerance is high', () => {
			const easyMission = createTestMission({ id: 'mission-1' });
			easyMission.attributes.dc = 10;
			const hardMission = createTestMission({ id: 'mission-2' });
			hardMission.attributes.dc = 20;
			const missions = [easyMission, hardMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ riskTolerance: 'high' });

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			const assignments = result.getAssignments();
			expect(assignments[0].missionId).toBe('mission-2');
		});

		it('should select best adventurer for mission', () => {
			const mission = createTestMission({ id: 'mission-1' });
			mission.attributes.primaryAbility = 'str';
			const weakAdventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle', level: 1 });
			weakAdventurer.attributes.abilityMods.set('str', 0);
			const strongAdventurer = createTestAdventurer({ id: 'adv-2', state: 'Idle', level: 5 });
			strongAdventurer.attributes.abilityMods.set('str', 3);
			const adventurers = [weakAdventurer, strongAdventurer];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine([mission], adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(false);
			const assignments = result.getAssignments();
			expect(assignments[0].adventurerId).toBe('adv-2');
		});

		it('should return empty allocation when no idle adventurers available', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
			const adventurers = [adventurer];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 1);

			expect(result.isEmpty()).toBe(true);
		});

		it('should allocate multiple missions when resources allow', () => {
			const mission1 = createTestMission({ id: 'mission-1' });
			const mission2 = createTestMission({ id: 'mission-2' });
			const missions = [mission1, mission2];
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const adventurers = [adventurer1, adventurer2];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 2);

			expect(result.getCount()).toBe(2);
			const assignments = result.getAssignments();
			const missionIds = assignments.map(a => a.missionId);
			const adventurerIds = assignments.map(a => a.adventurerId);
			expect(missionIds).toContain('mission-1');
			expect(missionIds).toContain('mission-2');
			expect(adventurerIds).toContain('adv-1');
			expect(adventurerIds).toContain('adv-2');
		});

		it('should respect maxAssignments limit', () => {
			const mission1 = createTestMission({ id: 'mission-1' });
			const mission2 = createTestMission({ id: 'mission-2' });
			const mission3 = createTestMission({ id: 'mission-3' });
			const missions = [mission1, mission2, mission3];
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const adventurer3 = createTestAdventurer({ id: 'adv-3', state: 'Idle' });
			const adventurers = [adventurer1, adventurer2, adventurer3];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 2);

			expect(result.getCount()).toBe(2);
		});

		it('should not assign same adventurer to multiple missions', () => {
			const mission1 = createTestMission({ id: 'mission-1' });
			const mission2 = createTestMission({ id: 'mission-2' });
			const missions = [mission1, mission2];
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurers = [adventurer];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 2);

			expect(result.getCount()).toBe(1); // Only one assignment possible with one adventurer
			const assignments = result.getAssignments();
			expect(assignments[0].adventurerId).toBe('adv-1');
		});

		it('should not assign same mission to multiple adventurers', () => {
			const mission = createTestMission({ id: 'mission-1' });
			const missions = [mission];
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const adventurers = [adventurer1, adventurer2];
			const doctrine = createTestDoctrine();

			const result = allocateMissionsByDoctrine(missions, adventurers, doctrine, 2);

			expect(result.getCount()).toBe(1); // Only one assignment possible with one mission
			const assignments = result.getAssignments();
			expect(assignments[0].missionId).toBe('mission-1');
		});
	});
});
