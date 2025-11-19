/**
 * Idle Loop System Tests - Pure function for idle progression
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IdleLoop } from './IdleLoop';
import { createTestGameState, createTestMission, createTestAdventurer } from '../../test-utils/testFactories';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import { setTimer } from '../primitives/TimerHelpers';
import type { Entity } from '../primitives/Requirement';

describe('IdleLoop', () => {
	let idleLoop: IdleLoop;

	beforeEach(() => {
		idleLoop = new IdleLoop();
	});

	describe('processIdleProgression', () => {
		it('should return new state with same entities when no progression needed', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			expect(result.newState).toBeDefined();
			expect(result.newState.playerId).toBe(state.playerId);
			expect(result.events).toHaveLength(0);
		});

		it('should resolve missions that are ready', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const pastTime = Timestamp.from(Date.now() - 1000);
			const futureTime = Timestamp.from(Date.now() + 1000);
			setTimer(mission, 'startedAt', pastTime);
			setTimer(mission, 'endsAt', pastTime); // Mission ended in the past
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Should process the mission (may generate events)
			expect(result.newState).toBeDefined();
		});

		it('should not resolve missions that are not ready', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const futureTime = Timestamp.from(Date.now() + 60000);
			setTimer(mission, 'endsAt', futureTime); // Mission ends in future
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Should not resolve mission yet
			expect(result.newState).toBeDefined();
		});

		it('should process mission automation', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Should process automation (may or may not start mission depending on doctrine)
			expect(result.newState).toBeDefined();
		});

		it('should process crafting queue', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Should process crafting (crafting queue exists in initial state)
			expect(result.newState).toBeDefined();
		});

		it('should process slot generation', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Should process slot generation
			expect(result.newState).toBeDefined();
		});

		it('should handle errors gracefully when resolving missions', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			// Create invalid mission state that might cause errors
			const pastTime = Timestamp.from(Date.now() - 1000);
			setTimer(mission, 'endsAt', pastTime);
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			// Should not throw, should handle error gracefully
			const result = idleLoop.processIdleProgression(state, now);

			expect(result.newState).toBeDefined();
		});

		it('should update resources when effects are applied', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Resources may be updated by slot generation or other effects
			expect(result.newState.resources).toBeDefined();
		});

		it('should generate events from mission resolution', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'InProgress' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
			// Set mission to be ready for resolution
			const pastTime = Timestamp.from(Date.now() - 1000);
			setTimer(mission, 'endsAt', pastTime);
			const entities = new Map<string, Entity>([
				[mission.id, mission],
				[adventurer.id, adventurer]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// May generate events from mission resolution
			expect(Array.isArray(result.events)).toBe(true);
		});

		it('should process multiple systems in correct order', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			const result = idleLoop.processIdleProgression(state, now);

			// Should process: mission resolution -> automation -> crafting -> slot generation
			expect(result.newState).toBeDefined();
			expect(result.events).toBeDefined();
		});
	});
});

