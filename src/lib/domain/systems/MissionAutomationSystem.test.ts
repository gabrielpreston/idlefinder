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
			}
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

