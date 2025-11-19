/**
 * Doctrine Engine Tests - Mission selection based on doctrine
 */

import { describe, it, expect } from 'vitest';
import { selectMissionByDoctrine } from './DoctrineEngine';
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
	describe('selectMissionByDoctrine', () => {
		it('should return null when no missions available', () => {
			const missions: Mission[] = [];
			const adventurers = [createTestAdventurer({ id: 'adv-1' })];
			const doctrine = createTestDoctrine();

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).toBeNull();
		});

		it('should return null when no adventurers available', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurers: Adventurer[] = [];
			const doctrine = createTestDoctrine();

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).toBeNull();
		});

		it('should select mission when missions and adventurers available', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine();

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.mission.id).toBe('mission-1');
			expect(result?.adventurers).toHaveLength(1);
			expect(result?.adventurers[0].id).toBe('adv-1');
		});

		it('should filter missions by preferred mission types', () => {
			const combatMission = createTestMission({ id: 'mission-1' });
			combatMission.attributes.missionType = 'combat';
			const explorationMission = createTestMission({ id: 'mission-2' });
			explorationMission.attributes.missionType = 'exploration';
			const missions = [combatMission, explorationMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ preferredMissionTypes: ['combat'] });

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.mission.attributes.missionType).toBe('combat');
		});

		it('should return null when no missions match preferred types', () => {
			const mission = createTestMission({ id: 'mission-1' });
			mission.attributes.missionType = 'combat';
			const missions = [mission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ preferredMissionTypes: ['exploration'] });

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).toBeNull();
		});

		it('should prefer missions with higher gold rewards when focus is gold', () => {
			const lowGoldMission = createTestMission({ id: 'mission-1' });
			lowGoldMission.attributes.baseRewards = { gold: 10, xp: 20 };
			const highGoldMission = createTestMission({ id: 'mission-2' });
			highGoldMission.attributes.baseRewards = { gold: 100, xp: 5 };
			const missions = [lowGoldMission, highGoldMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ focus: 'gold' });

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.mission.id).toBe('mission-2');
		});

		it('should prefer missions with higher XP rewards when focus is xp', () => {
			const lowXPMission = createTestMission({ id: 'mission-1' });
			lowXPMission.attributes.baseRewards = { gold: 100, xp: 5 };
			const highXPMission = createTestMission({ id: 'mission-2' });
			highXPMission.attributes.baseRewards = { gold: 10, xp: 50 };
			const missions = [lowXPMission, highXPMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ focus: 'xp' });

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.mission.id).toBe('mission-2');
		});

		it('should prefer easier missions when risk tolerance is low', () => {
			const easyMission = createTestMission({ id: 'mission-1' });
			easyMission.attributes.dc = 10;
			const hardMission = createTestMission({ id: 'mission-2' });
			hardMission.attributes.dc = 20;
			const missions = [easyMission, hardMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ riskTolerance: 'low' });

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.mission.id).toBe('mission-1');
		});

		it('should prefer harder missions when risk tolerance is high', () => {
			const easyMission = createTestMission({ id: 'mission-1' });
			easyMission.attributes.dc = 10;
			const hardMission = createTestMission({ id: 'mission-2' });
			hardMission.attributes.dc = 20;
			const missions = [easyMission, hardMission];
			const adventurers = [createTestAdventurer({ id: 'adv-1', state: 'Idle' })];
			const doctrine = createTestDoctrine({ riskTolerance: 'high' });

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.mission.id).toBe('mission-2');
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

			const result = selectMissionByDoctrine([mission], adventurers, doctrine);

			expect(result).not.toBeNull();
			expect(result?.adventurers[0].id).toBe('adv-2');
		});

		it('should return null when no idle adventurers available', () => {
			const missions = [createTestMission({ id: 'mission-1' })];
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
			const adventurers = [adventurer];
			const doctrine = createTestDoctrine();

			const result = selectMissionByDoctrine(missions, adventurers, doctrine);

			expect(result).toBeNull();
		});
	});
});

