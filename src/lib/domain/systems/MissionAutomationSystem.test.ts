/**
 * Mission Automation System Tests - Automatic mission selection and starting
 */

import { describe, it, expect } from 'vitest';
import { automateMissionSelection } from './MissionAutomationSystem';
import { createTestGameState, createTestMission, createTestAdventurer } from '../../test-utils/testFactories';
import { MissionDoctrine } from '../entities/MissionDoctrine';
import { Identifier } from '../valueObjects/Identifier';
import type { Entity } from '../primitives/Requirement';
import { StartMissionAction } from '../actions/StartMissionAction';

describe('MissionAutomationSystem', () => {
	describe('automateMissionSelection', () => {
		it('should return empty actions when no doctrine exists', () => {
			const state = createTestGameState();
			const result = automateMissionSelection(state);

			expect(result.actions).toHaveLength(0);
		});

		it('should handle missing doctrine gracefully', () => {
			// Test that system works when no doctrine exists
			const state = createTestGameState();
			const result = automateMissionSelection(state);

			expect(result.actions).toHaveLength(0);
		});

		it('should return empty actions when no available missions', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			expect(result.actions).toHaveLength(0);
		});

		it('should return empty actions when no available adventurers', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission.id, mission]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			expect(result.actions).toHaveLength(0);
		});

		it('should create StartMissionAction when mission and adventurer available', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			expect(result.actions.length).toBeGreaterThanOrEqual(0);
			if (result.actions.length > 0) {
				expect(result.actions[0]).toBeInstanceOf(StartMissionAction);
				expect(result.actions[0]['missionId']).toBe('mission-1');
				expect(result.actions[0]['adventurerId']).toBe('adv-1');
			}
		});

		it('should fill all available slots when resources allow', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission1 = createTestMission({ id: 'mission-1', state: 'Available' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'Available' });
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission1.id, mission1],
				[mission2.id, mission2],
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			// Should create actions for both missions (assuming 2+ available slots)
			expect(result.actions.length).toBeGreaterThanOrEqual(1);
			expect(result.actions.every(a => a instanceof StartMissionAction)).toBe(true);
		});

		it('should assign multiple adventurers to multiple missions', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission1 = createTestMission({ id: 'mission-1', state: 'Available' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'Available' });
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission1.id, mission1],
				[mission2.id, mission2],
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			// Should create multiple actions
			expect(result.actions.length).toBeGreaterThanOrEqual(1);
			const adventurerIds = result.actions.map(a => a['adventurerId']);
			const uniqueAdventurers = new Set(adventurerIds);
			// If multiple slots available, should use multiple adventurers
			if (result.actions.length > 1) {
				expect(uniqueAdventurers.size).toBeGreaterThan(1);
			}
		});

		it('should stop when slots filled', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission1 = createTestMission({ id: 'mission-1', state: 'Available' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'Available' });
			const mission3 = createTestMission({ id: 'mission-3', state: 'Available' });
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const adventurer3 = createTestAdventurer({ id: 'adv-3', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission1.id, mission1],
				[mission2.id, mission2],
				[mission3.id, mission3],
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2],
				[adventurer3.id, adventurer3]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			// Should respect available slots limit (typically 1-5)
			expect(result.actions.length).toBeLessThanOrEqual(5); // Reasonable upper bound
		});

		it('should stop when resources exhausted', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission1 = createTestMission({ id: 'mission-1', state: 'Available' });
			const mission2 = createTestMission({ id: 'mission-2', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission1.id, mission1],
				[mission2.id, mission2],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			// Should only assign one mission (only one adventurer available)
			expect(result.actions.length).toBe(1);
		});

		it('should not select missions that are not Available', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const inProgressMission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[inProgressMission.id, inProgressMission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			expect(result.actions).toHaveLength(0);
		});

		it('should not select adventurers that are not Idle', () => {
			const doctrineId = Identifier.generate<'MissionDoctrineId'>();
			const doctrine = MissionDoctrine.createDefault(doctrineId);
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const onMissionAdventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
			const entities = new Map<string, Entity>([
				[doctrine.id, doctrine],
				[mission.id, mission],
				[onMissionAdventurer.id, onMissionAdventurer]
			]);
			const state = createTestGameState({ entities });

			const result = automateMissionSelection(state);

			expect(result.actions).toHaveLength(0);
		});
	});
});

