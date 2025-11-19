/**
 * StartMissionHandlerV2 Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { createTestMission } from '../test-utils/testFactories';
import type { Entity } from '../domain/primitives/Requirement';

describe('StartMissionHandlerV2 Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents } = setupIntegrationTest({
			eventTypes: ['MissionStarted', 'CommandFailed']
		}));
	});

	describe('StartMission command', () => {
		it('should start mission with available adventurer', async () => {
			// First recruit an adventurer
			const recruitCommand = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});
			await busManager.commandBus.dispatch(recruitCommand);

			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurerId = adventurers[0].id;

			// Handler creates missions from templates, so use a template-based mission ID
			// Format: templateId-timestamp-random (e.g., "explore-forest-1234567890-abc123")
			const timestamp = Date.now();
			const random = Math.random().toString(36).substring(7);
			const missionId = `explore-forest-${timestamp}-${random}`;

			// Start mission (handler will create the mission from template)
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

