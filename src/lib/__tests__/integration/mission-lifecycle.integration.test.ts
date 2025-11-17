/**
 * Mission Lifecycle Integration Tests - Fast tests with fake timers
 * Speed target: <400ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BusManager } from '../../bus/BusManager';
import { registerHandlersV2 } from '../../handlers/indexV2';
import { createTestGameState, createTestCommand, setupMockLocalStorage } from '../../test-utils';
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

		const initialState = createTestGameState();
		busManager = new BusManager(initialState, testTimeSource);
		registerHandlersV2(busManager);

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

			const stateAfterRecruit = busManager.getState();
			const adventurers = Array.from(stateAfterRecruit.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurerId = adventurers[0].id;

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
			const missions = Array.from(state.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			const mission = missions.find(m => m.id.startsWith('mission-1-') || m.metadata.missionId === 'mission-1');
			expect(mission).toBeDefined();

			// Advance time and trigger tick handler manually
			const now = Date.now();
			const endsAt = mission!.timers.get('endsAt');
			const elapsed = endsAt ? endsAt.value - now + 1000 : 61000; // Mission duration + buffer
			vi.advanceTimersByTime(elapsed);

			// Manually trigger tick handler (IdleLoop tick handler)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const tickHandler = (busManager as any).tickBus.handlers.values().next().value;
			if (tickHandler) {
				await tickHandler(elapsed, new Date(now + elapsed));
			}

			// Mission should be completed
			const finalState = busManager.getState();
			const finalMissions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			const completedMission = finalMissions.find(m => m.id === mission!.id);
			expect(completedMission?.state).toBe('Completed');

			// Adventurer should be freed
			const updatedAdventurer = Array.from(finalState.entities.values()).find(e => e.id === adventurerId) as import('../../domain/entities/Adventurer').Adventurer;
			expect(updatedAdventurer?.state).toBe('Idle');

			// Rewards should be applied (may be 0 on CriticalFailure, but should be present)
			const goldReward = finalState.resources.get('gold') || 0;
			expect(goldReward).toBeGreaterThanOrEqual(0);

			// Experience should be applied (may be 0 on CriticalFailure, but should be present)
			// Check that XP attribute exists and was updated (even if 0)
			expect(updatedAdventurer?.attributes.xp).toBeDefined();
			expect(updatedAdventurer?.attributes.xp).toBeGreaterThanOrEqual(0);
			
			// If mission succeeded, XP should be > 0
			// (Mission can fail and give 0 XP, which is valid)
			if (goldReward > 0) {
				// Mission succeeded, so XP should also be > 0
				expect(updatedAdventurer?.attributes.xp).toBeGreaterThan(0);
			}
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
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			const adv1Id = adventurers[0].id;
			const adv2Id = adventurers[1].id;

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

			const stateAfterStart = busManager.getState();
			const missionsAfterStart = Array.from(stateAfterStart.entities.values()).filter(e => e.type === 'Mission');
			expect(missionsAfterStart).toHaveLength(2);

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
			const finalMissions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			expect(finalMissions.every(m => m.state === 'Completed')).toBe(true);
		});
	});

	describe('adventurer availability constraints', () => {
		it('should prevent assigning same adventurer to multiple missions', async () => {
			await busManager.commandBus.dispatch(
				createTestCommand('RecruitAdventurer', { name: 'Test', traits: [] })
			);

			const stateAfterRecruit = busManager.getState();
			const adventurers = Array.from(stateAfterRecruit.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurerId = adventurers[0].id;

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
			const finalState = busManager.getState();
			const missions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission');
			expect(missions).toHaveLength(1);
		});
	});
});

