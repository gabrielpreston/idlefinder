/**
 * StartMissionHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestMission } from '../test-utils/testFactories';
import type { Entity } from '../domain/primitives/Requirement';
import type { Facility } from '../domain/entities/Facility';
// Import gating module to ensure gates are registered
import '../domain/gating';

describe('StartMissionHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		// Create initial state with missions for testing
		const initialState = createTestGameState();
		
		// Upgrade Guild Hall to tier 1 to unlock roster_capacity_1 gate (capacity = 1)
		// This allows recruitment in tests
		const guildhall = Array.from(initialState.entities.values()).find(
			(e) =>
				e.type === 'Facility' &&
				(e as Facility).attributes.facilityType === 'Guildhall'
		) as Facility;
		if (guildhall) {
			guildhall.upgrade(); // Upgrades from tier 0 to tier 1
		}
		
		// Ensure we have at least one available mission
		const existingMissions = Array.from(initialState.entities.values()).filter(
			e => e.type === 'Mission' && (e as import('../domain/entities/Mission').Mission).state === 'Available'
		);
		if (existingMissions.length === 0) {
			// Add a test mission if none exist
			const testMission = createTestMission({ id: 'test-mission-1', state: 'Available' });
			initialState.entities.set(testMission.id, testMission);
		}
		
		({ busManager, publishedEvents } = setupIntegrationTest({
			initialState,
			eventTypes: ['MissionStarted', 'CommandFailed', 'AdventurerRecruited']
		}));
	});

	describe('StartMission command', () => {
		it('should start mission with available adventurer', async () => {
			// Get an available mission from the initial state (before recruiting)
			const initialState = busManager.getState();
			const initialMissions = Array.from(initialState.entities.values()).filter(
				e => e.type === 'Mission' && (e as import('../domain/entities/Mission').Mission).state === 'Available'
			) as import('../domain/entities/Mission').Mission[];
			expect(initialMissions.length).toBeGreaterThan(0);
			const missionId = initialMissions[0].id;

			// First recruit an adventurer
			const recruitCommand = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});
			await busManager.commandBus.dispatch(recruitCommand);

			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			// Find the recruited adventurer by name
			const recruitedAdventurer = adventurers.find(a => (a as import('../domain/entities/Adventurer').Adventurer).metadata.name === 'Test Adventurer');
			expect(recruitedAdventurer).toBeDefined();
			const adventurerId = recruitedAdventurer!.id;

			// Start mission using existing mission from pool
			const startCommand = createTestCommand('StartMission', {
				missionId: missionId,
				adventurerIds: [adventurerId]
			});
			await busManager.commandBus.dispatch(startCommand);

			// Verify event published
			const missionStartedEvents = publishedEvents.filter(e => e.type === 'MissionStarted');
			expect(missionStartedEvents.length).toBeGreaterThan(0);

			// Verify state updated - mission should be created and in progress
			const finalState = busManager.getState();
			const missions = Array.from(finalState.entities.values()).filter(e => e.type === 'Mission');
			const missionEntity = missions.find(m => m.id === missionId) as import('../domain/entities/Mission').Mission;
			expect(missionEntity).toBeDefined();
			expect(missionEntity.state).toBe('InProgress');
		});

		it('should fail when mission not found', async () => {
			const command = createTestCommand('StartMission', {
				missionId: 'nonexistent',
				adventurerIds: ['adv-1']
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when adventurer not found', async () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(mission.id, mission);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: ['nonexistent']
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when multiple adventurers provided (MVP limitation)', async () => {
			const command = createTestCommand('StartMission', {
				missionId: 'mission-1',
				adventurerIds: ['adv-1', 'adv-2']
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.reason).toContain('single adventurer');
			}
		});
	});
});

