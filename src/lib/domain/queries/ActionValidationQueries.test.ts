/**
 * Action Validation Queries Tests - Action requirement validation queries
 */

import { describe, it, expect } from 'vitest';
import {
	validateAction,
	canPerformAction,
	getActionValidationReason
} from './ActionValidationQueries';
import { StartMissionAction } from '../actions/StartMissionAction';
import { createTestGameState, createTestMission, createTestAdventurer } from '../../test-utils/testFactories';
import { Timestamp } from '../valueObjects/Timestamp';
import type { Entity } from '../primitives/Requirement';

describe('ActionValidationQueries', () => {
	describe('validateAction', () => {
		it('should return satisfied when all requirements met', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });
			const action = new StartMissionAction('mission-1', 'adv-1');
			const time = Timestamp.now();

			const result = validateAction(action, state, time);

			expect(result.satisfied).toBe(true);
		});

		it('should return unsatisfied when requirements not met', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const state = createTestGameState({ entities });
			const action = new StartMissionAction('mission-1', 'adv-1');
			const time = Timestamp.now();

			const result = validateAction(action, state, time);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toBeDefined();
		});

		it('should include reason when requirement fails', () => {
			const state = createTestGameState();
			const action = new StartMissionAction('nonexistent', 'adv-1');
			const time = Timestamp.now();

			const result = validateAction(action, state, time);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toBeDefined();
			expect(typeof result.reason).toBe('string');
		});

		it('should use actionParams when provided', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });
			const action = new StartMissionAction('mission-1', 'adv-1');
			const time = Timestamp.now();
			const actionParams = { customParam: 'value' };

			const result = validateAction(action, state, time, actionParams);

			// Should still validate correctly
			expect(result.satisfied).toBe(true);
		});
	});

	describe('canPerformAction', () => {
		it('should return true when action can be performed', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });
			const action = new StartMissionAction('mission-1', 'adv-1');
			const time = Timestamp.now();

			expect(canPerformAction(action, state, time)).toBe(true);
		});

		it('should return false when action cannot be performed', () => {
			const state = createTestGameState();
			const action = new StartMissionAction('nonexistent', 'adv-1');
			const time = Timestamp.now();

			expect(canPerformAction(action, state, time)).toBe(false);
		});
	});

	describe('getActionValidationReason', () => {
		it('should return null when action can be performed', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });
			const action = new StartMissionAction('mission-1', 'adv-1');
			const time = Timestamp.now();

			expect(getActionValidationReason(action, state, time)).toBeNull();
		});

		it('should return reason when action cannot be performed', () => {
			const state = createTestGameState();
			const action = new StartMissionAction('nonexistent', 'adv-1');
			const time = Timestamp.now();

			const reason = getActionValidationReason(action, state, time);
			expect(reason).not.toBeNull();
			expect(typeof reason).toBe('string');
			expect(reason?.length).toBeGreaterThan(0);
		});

		it('should return default reason when no specific reason provided', () => {
			// Create an action that will fail but might not have a specific reason
			const state = createTestGameState();
			const action = new StartMissionAction('mission-1', 'adv-1');
			const time = Timestamp.now();

			const reason = getActionValidationReason(action, state, time);
			// Should either have a specific reason or default message
			expect(reason).not.toBeNull();
		});
	});
});

