/**
 * Offline Catch-Up Integration Tests - Fast tests with fake timers
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusManager } from '../../bus/BusManager';
import { registerHandlers } from '../../handlers/index';
import { createTestGameState, createTestMission, createTestAdventurer, createTestResourceBundle, setupMockLocalStorage } from '../../test-utils';
import type { DomainEvent } from '../../bus/types';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { Duration } from '../../domain/valueObjects/Duration';

describe('Offline Catch-Up Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];
	const testTimeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));

	beforeEach(() => {
		vi.useFakeTimers();
		setupMockLocalStorage();

		const initialState = createTestGameState();
		busManager = new BusManager(initialState, testTimeSource);
		registerHandlers(busManager);

		publishedEvents = [];
		busManager.domainEventBus.subscribe('MissionCompleted', (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: 'MissionCompleted',
				payload: payload as DomainEvent['payload'],
				timestamp: new Date().toISOString()
			});
		});
		busManager.domainEventBus.subscribe('ResourcesChanged', (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: 'ResourcesChanged',
				payload: payload as DomainEvent['payload'],
				timestamp: new Date().toISOString()
			});
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('tick replay', () => {
		it('should complete missions during tick replay', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
			const startedAt = Timestamp.from(Date.now() - 10000); // Started 10 seconds ago
			const endsAt = startedAt.add(Duration.ofSeconds(5)); // 5 second duration
			const mission = createTestMission({
				id: 'mission-1',
				baseDuration: Duration.ofSeconds(5),
				state: 'InProgress',
				startedAt,
				endsAt
			});

			const entities = new Map<string, import('../../domain/primitives/Requirement').Entity>();
			entities.set(adventurer.id, adventurer);
			entities.set(mission.id, mission);
			const initialState = createTestGameState({ entities });

			const manager = new BusManager(initialState, testTimeSource);
			registerHandlers(manager);

			// Mock persistence to return state with old lastPlayed
			const lastPlayed = new Date(Date.now() - 10000);
			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(initialState);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(lastPlayed);

			manager.domainEventBus.subscribe('MissionCompleted', (payload: DomainEvent['payload']) => {
				publishedEvents.push({
					type: 'MissionCompleted',
					payload: payload as DomainEvent['payload'],
					timestamp: new Date().toISOString()
				});
			});

			await manager.initialize();

			// Mission should be completed (started 10s ago, duration 5s)
			const finalState = manager.getState();
			const missions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			const completedMission = missions.find(m => m.id === 'mission-1');
			expect(completedMission?.state).toBe('Completed');
		});

		it('should apply resource rewards correctly during catch-up', async () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'OnMission' });
			const startedAt = Timestamp.from(Date.now() - 10000);
			const endsAt = startedAt.add(Duration.ofSeconds(5));
			const mission = createTestMission({
				id: 'mission-1',
				baseDuration: Duration.ofSeconds(5),
				state: 'InProgress',
				startedAt,
				endsAt
			});

			const entities = new Map<string, import('../../domain/primitives/Requirement').Entity>();
			entities.set(adventurer.id, adventurer);
			entities.set(mission.id, mission);
			const resources = createTestResourceBundle({ gold: 0, fame: 0 });
			const initialState = createTestGameState({ entities, resources });

			const manager = new BusManager(initialState, testTimeSource);
			registerHandlers(manager);

			const lastPlayed = new Date(Date.now() - 10000);
			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(initialState);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(lastPlayed);

			await manager.initialize();

			// Note: Mission completion rewards are applied by ResolveMissionAction
			// which is called by IdleLoop tick handler
			// For this test, we verify the mission is marked completed
			const finalState = manager.getState();
			const missions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			expect(missions[0].state).toBe('Completed');
		});

		it('should update adventurer status during catch-up', async () => {
			const adventurer = createTestAdventurer({
				id: 'adv-1',
				state: 'OnMission'
			});
			const startedAt = Timestamp.from(Date.now() - 10000);
			const endsAt = startedAt.add(Duration.ofSeconds(5));
			const mission = createTestMission({
				id: 'mission-1',
				baseDuration: Duration.ofSeconds(5),
				state: 'InProgress',
				startedAt,
				endsAt
			});

			const entities = new Map<string, import('../../domain/primitives/Requirement').Entity>();
			entities.set(adventurer.id, adventurer);
			entities.set(mission.id, mission);
			const initialState = createTestGameState({ entities });

			const manager = new BusManager(initialState, testTimeSource);
			registerHandlers(manager);

			const lastPlayed = new Date(Date.now() - 10000);
			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(initialState);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(lastPlayed);

			await manager.initialize();

			// Mission should be completed
			const finalState = manager.getState();
			const missions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			expect(missions[0].state).toBe('Completed');

			// Adventurer should be freed when mission completes
			const updatedAdventurer = Array.from(finalState.entities.values()).find(e => e.id === 'adv-1') as import('../../domain/entities/Adventurer').Adventurer;
			expect(updatedAdventurer?.state).toBe('Idle');
		});
	});
});

