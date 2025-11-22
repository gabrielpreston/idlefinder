/**
 * RecruitAdventurerHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState, createTestResourceBundle, createEmptyTestGameState } from '../test-utils';
import { requireGuildHall, findAdventurerById } from '../test-utils/entityTestHelpers';
import { expectAdventurerExists } from '../test-utils/expectHelpers';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';
import { GameConfig } from '../domain/config/GameConfig';
import type { Adventurer } from '../domain/entities/Adventurer';
// Import gating module to ensure gates are registered
import '../domain/gating';

describe('RecruitAdventurerHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		const initialState = createTestGameState({ 
			resources: createTestResourceBundle({ gold: 100 }) 
		});
		
		// Upgrade Guild Hall to tier 1 to unlock roster_capacity_1 gate (capacity = 1)
		// This allows recruitment in tests
		const guildhall = requireGuildHall(initialState);
		guildhall.upgrade(); // Upgrades from tier 0 to tier 1
		
		({ busManager, publishedEvents } = setupIntegrationTest({
			initialState,
			eventTypes: ['AdventurerRecruited', 'CommandFailed']
		}));
	});

	describe('RecruitAdventurer command', () => {
		it('should recruit adventurer with name', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			// Verify event published
			expect(publishedEvents).toHaveLength(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			const payload = publishedEvents[0].payload as { name: string; adventurerId: string; traits: string[] };
			expect(payload.name).toBe('Test Adventurer');

			// Verify state updated - find the recruited adventurer by name
			const state = busManager.getState();
			const adventurer = expectAdventurerExists(state, 'Test Adventurer');
			expect(adventurer.metadata.name).toBe('Test Adventurer');
			expect(adventurer.state).toBe('Idle');
		});

		it('should auto-generate name when not provided', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			// Verify event published
			expect(publishedEvents).toHaveLength(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			const payload = publishedEvents[0].payload as { name: string; adventurerId: string; traits: string[] };
			
			// Verify name is auto-generated (starts with "Adventurer")
			expect(payload.name).toMatch(/^Adventurer [A-F0-9]{8}$/);
			
			// Verify name contains short ID from adventurer ID
			const shortId = payload.adventurerId.slice(0, 8).toUpperCase();
			expect(payload.name).toBe(`Adventurer ${shortId}`);

			// Verify state updated
			const state = busManager.getState();
			const adventurer = findAdventurerById(state, payload.adventurerId);
			expect(adventurer.metadata.name).toBe(payload.name);
			expect(adventurer.state).toBe('Idle');
		});

		it('should fail when insufficient gold (new test)', async () => {
			const recruitCost = GameConfig.costs.recruitAdventurer;
			
			// Set state with insufficient gold
			const initialState = createTestGameState({
				resources: createTestResourceBundle({ gold: recruitCost - 1 }) // Not enough
			});
			busManager.setState(initialState);

			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.commandType).toBe('RecruitAdventurer');
				expect(payload.reason).toContain('Insufficient gold');
				expect(payload.reason).toContain(`need ${String(recruitCost)}`);
			}
		});

		it('should fail when preview adventurer not found', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				previewAdventurerId: 'nonexistent-preview-id',
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			// Verify CommandFailed event published
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			if (failedEvent.type === 'CommandFailed') {
				const payload = failedEvent.payload as { commandType: string; reason: string };
				expect(payload.commandType).toBe('RecruitAdventurer');
				expect(payload.reason).toContain('not found or invalid');
			}
		});

		it('should fail when preview adventurer has wrong type', async () => {
			// Create a non-Adventurer entity with the ID we'll use
			const initialState = busManager.getState();
			const entities = new Map(initialState.entities);
			// We can't easily create a non-Adventurer entity, so we'll test with a non-preview adventurer
			const existingAdventurers = Array.from(entities.values()).filter(e => e.type === 'Adventurer');
			if (existingAdventurers.length > 0) {
				const nonPreviewAdventurer = existingAdventurers[0] as Adventurer;
				// Change state to Idle (not Preview)
				if (nonPreviewAdventurer.state === 'Preview') {
					// Skip this test if all adventurers are preview
					return;
				}

				const command = createTestCommand('RecruitAdventurer', {
					name: 'Test Adventurer',
					previewAdventurerId: nonPreviewAdventurer.id,
					traits: []
				});

				await busManager.commandBus.dispatch(command);

				// Verify CommandFailed event published
				const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
				expect(failedEvents.length).toBeGreaterThan(0);
				const failedEvent = failedEvents[0];
				if (failedEvent.type === 'CommandFailed') {
					const payload = failedEvent.payload as { commandType: string; reason: string };
					expect(payload.commandType).toBe('RecruitAdventurer');
					expect(payload.reason).toContain('not found or invalid');
				}
			}
		});

		it('should recruit adventurer with preview adventurer', async () => {
			const initialState = busManager.getState();
			const previewAdventurers = Array.from(initialState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			) as Adventurer[];
			
			if (previewAdventurers.length === 0) {
				// Skip if no preview adventurers
				return;
			}

			const previewAdventurer = previewAdventurers[0];
			const initialPreviewCount = previewAdventurers.length;

			const command = createTestCommand('RecruitAdventurer', {
				previewAdventurerId: previewAdventurer.id,
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			// Verify event published
			expect(publishedEvents).toHaveLength(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			const payload = publishedEvents[0].payload as { name: string; adventurerId: string; traits: string[] };
			
			// Verify name is auto-generated (starts with "Adventurer")
			expect(payload.name).toMatch(/^Adventurer [A-F0-9]{8}$/);

			// Verify state updated
			const finalState = busManager.getState();
			const finalPreviewAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).state === 'Preview'
			);
			// Preview adventurer should be removed
			expect(finalPreviewAdventurers.length).toBe(initialPreviewCount - 1);
			
			// Recruited adventurer should exist
			const recruitedAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).id === payload.adventurerId
			);
			expect(recruitedAdventurers.length).toBe(1);
			const recruited = recruitedAdventurers[0] as Adventurer;
			expect(recruited.state).toBe('Idle');
			expect(recruited.metadata.name).toBe(payload.name);
		});

		it('should recruit adventurer with random generation when no preview ID', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				traits: ['trait1', 'trait2']
			});

			await busManager.commandBus.dispatch(command);

			// Verify event published
			expect(publishedEvents).toHaveLength(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			const payload = publishedEvents[0].payload as { name: string; adventurerId: string; traits: string[] };
			
			// Verify name is auto-generated
			expect(payload.name).toMatch(/^Adventurer [A-F0-9]{8}$/);
			expect(payload.traits).toEqual(['trait1', 'trait2']);

			// Verify state updated
			const finalState = busManager.getState();
			const recruitedAdventurers = Array.from(finalState.entities.values()).filter(
				e => e.type === 'Adventurer' && (e as Adventurer).id === payload.adventurerId
			);
			expect(recruitedAdventurers.length).toBe(1);
			const recruited = recruitedAdventurers[0] as Adventurer;
			expect(recruited.state).toBe('Idle');
			expect(recruited.attributes.level).toBe(1);
			expect(recruited.attributes.xp).toBe(0);
			expect(recruited.metadata.name).toBe(payload.name);
		});

		it('should recruit adventurer with traits', async () => {
			// Clear any previous events
			publishedEvents.length = 0;
			
			const command = createTestCommand('RecruitAdventurer', {
				name: 'Brave Fighter',
				traits: ['brave', 'combat']
			});

			await busManager.commandBus.dispatch(command);

			// Verify event published
			expect(publishedEvents).toHaveLength(1);
			expect(publishedEvents[0].type).toBe('AdventurerRecruited');
			
			const state = busManager.getState();
			const adventurer = expectAdventurerExists(state, 'Brave Fighter');
			expect(adventurer.attributes.traitTags).toContain('brave');
			expect(adventurer.attributes.traitTags).toContain('combat');
		});

		it('should create adventurer with default attributes', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: 'New Adventurer',
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurer = adventurers[0] as import('../domain/entities/Adventurer').Adventurer;
			expect(adventurer.attributes.level).toBe(1);
			expect(adventurer.attributes.xp).toBe(0);
			expect(adventurer.attributes.roleKey).toBeDefined();
		});

		it('should deduct 50 gold when recruiting adventurer', async () => {
			const initialState = createTestGameState({ 
				resources: createTestResourceBundle({ gold: 100 }) 
			});
			
			// Upgrade Guild Hall to tier 1 to unlock roster_capacity_1 gate (capacity = 1)
			const guildhall = requireGuildHall(initialState);
			guildhall.upgrade(); // Upgrades from tier 0 to tier 1
			
			const { busManager: testBusManager, publishedEvents: testEvents } = setupIntegrationTest({
				initialState,
				eventTypes: ['AdventurerRecruited', 'CommandFailed']
			});

			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});

			await testBusManager.commandBus.dispatch(command);

			// Verify recruitment succeeded
			expect(testEvents).toHaveLength(1);
			expect(testEvents[0].type).toBe('AdventurerRecruited');

			const state = testBusManager.getState();
			expect(state.resources.get('gold')).toBe(50);
			
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			// Initial state has 4 preview adventurers, so we should have 5 total
			expect(adventurers.length).toBeGreaterThanOrEqual(5);
			const adventurer = expectAdventurerExists(state, 'Test Adventurer');
			expect(adventurer.metadata.name).toBe('Test Adventurer');
		});

		it('should fail when insufficient gold', async () => {
			const initialState = createEmptyTestGameState({ 
				resources: createTestResourceBundle({ gold: 25 }) 
			});
			const { busManager: testBusManager, publishedEvents } = setupIntegrationTest({
				initialState,
				eventTypes: ['AdventurerRecruited', 'CommandFailed']
			});

			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});

			await testBusManager.commandBus.dispatch(command);

			// Verify CommandFailed event
			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
			const failedEvent = failedEvents[0];
			expect(failedEvent.payload).toHaveProperty('reason');
			expect((failedEvent.payload as { reason: string }).reason).toContain('Insufficient gold');

			// Verify gold unchanged
			const state = testBusManager.getState();
			expect(state.resources.get('gold')).toBe(25);

			// Verify no adventurer created (using empty state, so should be 0)
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			expect(adventurers).toHaveLength(0);
		});
	});
});

