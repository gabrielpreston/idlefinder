/**
 * Mission Lifecycle Integration Tests - Fast tests with fake timers
 * Speed target: <400ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusManager } from '../../bus/BusManager';
import { registerHandlers } from '../../handlers';
import { createTestPlayerState, createTestCommand, setupMockLocalStorage } from '../../test-utils';
import type { DomainEvent } from '../../bus/types';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';

describe('Mission Lifecycle Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];
	const testTimeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));

	beforeEach(() => {
		vi.useFakeTimers();
		setupMockLocalStorage();

		const initialState = createTestPlayerState();
		busManager = new BusManager(initialState, testTimeSource);
		registerHandlers(busManager);

		publishedEvents = [];
		busManager.domainEventBus.subscribe('MissionStarted', (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: 'MissionStarted',
				payload: payload as DomainEvent['payload'],
				timestamp: new Date().toISOString()
			});
		});
		busManager.domainEventBus.subscribe('MissionCompleted', (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: 'MissionCompleted',
				payload: payload as DomainEvent['payload'],
				timestamp: new Date().toISOString()
			});
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('mission progression', () => {
		it('should start mission → tick progression → completion → rewards', async () => {
			// Recruit adventurer
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			const adventurerId = busManager.getState().adventurers[0].id;

			// Start mission
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-1',
					adventurerIds: [adventurerId]
				})
			);

			expect(publishedEvents).toContainEqual(
				expect.objectContaining({ type: 'MissionStarted' })
			);

			// Get mission start time
			const state = busManager.getState();
			// Mission ID is unique instance ID (mission-1-timestamp-random), find by prefix
			const mission = state.missions.find((m: { id: string }) => m.id.startsWith('mission-1-'));
			expect(mission).toBeDefined();

			// Advance time and trigger tick handler manually
			// MissionSystem uses Date.now() which advances with fake timers
			const now = Date.now();
			const elapsed = mission!.duration + 1000; // Mission duration + buffer
			vi.advanceTimersByTime(elapsed);

			// Manually trigger tick handler (MissionSystem tick handler)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const tickHandler = (busManager as any).tickBus.handlers.values().next().value;
			if (tickHandler) {
				await tickHandler(elapsed, new Date(now + elapsed));
			}

			// Mission should be completed
			const finalState = busManager.getState();
			// Mission ID is unique instance ID (mission-1-timestamp-random), find by prefix
			const completedMission = finalState.missions.find((m: { id: string }) => m.id.startsWith('mission-1-'));
			expect(completedMission?.status).toBe('completed');

			// Adventurer should be freed
			const updatedAdventurer = finalState.adventurers.find((a) => a.id === adventurerId);
			expect(updatedAdventurer?.status).toBe('idle');
			expect(updatedAdventurer?.assignedMissionId).toBeNull();

			// Rewards should be applied (mission has default reward: gold: 50, supplies: 10, fame: 1)
			expect(finalState.resources.gold).toBeGreaterThan(0);
			expect(finalState.resources.supplies).toBeGreaterThan(0);
			expect(finalState.fame).toBeGreaterThan(0);

			// Experience should be applied (mission has default experience: 10)
			expect(updatedAdventurer?.experience).toBeGreaterThan(0);
		});

		it('should handle multiple missions simultaneously', async () => {
			// Recruit multiple adventurers
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Adv 1', traits: [] })
			);
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Adv 2', traits: [] })
			);

			const state = busManager.getState();
			const adv1Id = state.adventurers[0].id;
			const adv2Id = state.adventurers[1].id;

			// Start two missions
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-1',
					adventurerIds: [adv1Id]
				})
			);

			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-2',
					adventurerIds: [adv2Id]
				})
			);

			expect(busManager.getState().missions).toHaveLength(2);

			// Advance time and trigger tick handler
			const elapsed = 61000;
			vi.advanceTimersByTime(elapsed);

			// Manually trigger tick handler
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const tickHandler = (busManager as any).tickBus.handlers.values().next().value;
			if (tickHandler) {
				await tickHandler(elapsed, new Date(Date.now()));
			}

			// Both missions should be completed
			const finalState = busManager.getState();
			expect(finalState.missions.every((m: { status: string }) => m.status === 'completed')).toBe(
				true
			);
		});
	});

	describe('adventurer availability constraints', () => {
		it('should prevent assigning same adventurer to multiple missions', async () => {
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			const adventurerId = busManager.getState().adventurers[0].id;

			// Start first mission
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-1',
					adventurerIds: [adventurerId]
				})
			);

			// Try to start second mission with same adventurer
			await busManager.commandBus.dispatch(
				createTestCommand('StartMission', {
					missionId: 'mission-2',
					adventurerIds: [adventurerId]
				})
			);

			// Should fail (adventurer unavailable)
			const failedEvents: DomainEvent[] = [];
			busManager.domainEventBus.subscribe('CommandFailed', (payload: DomainEvent['payload']) => {
				failedEvents.push({
					type: 'CommandFailed',
					payload: payload as DomainEvent['payload'],
					timestamp: new Date().toISOString()
				});
			});

			// Verify only one mission exists
			expect(busManager.getState().missions).toHaveLength(1);
		});
	});
});

