/**
 * RecruitAdventurerHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState, createTestResourceBundle } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';

describe('RecruitAdventurerHandler Integration', () => {
	let busManager: BusManager;
	let publishedEvents: DomainEvent[];

	beforeEach(() => {
		const initialState = createTestGameState({ 
			resources: createTestResourceBundle({ gold: 100 }) 
		});
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

			// Verify state updated
			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			expect(adventurers).toHaveLength(1);
			const adventurer = adventurers[0] as import('../domain/entities/Adventurer').Adventurer;
			expect(adventurer.metadata.name).toBe('Test Adventurer');
			expect(adventurer.state).toBe('Idle');
		});

		it('should recruit adventurer with traits', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: 'Brave Fighter',
				traits: ['brave', 'combat']
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			const adventurer = adventurers[0] as import('../domain/entities/Adventurer').Adventurer;
			expect(adventurer.attributes.traitTags).toContain('brave');
			expect(adventurer.attributes.traitTags).toContain('combat');
		});

		it('should fail when name is empty', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: '',
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
		});

		it('should fail when name is whitespace only', async () => {
			const command = createTestCommand('RecruitAdventurer', {
				name: '   ',
				traits: []
			});

			await busManager.commandBus.dispatch(command);

			const failedEvents = publishedEvents.filter(e => e.type === 'CommandFailed');
			expect(failedEvents.length).toBeGreaterThan(0);
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
			const { busManager: testBusManager } = setupIntegrationTest({
				initialState,
				eventTypes: ['AdventurerRecruited', 'CommandFailed']
			});

			const command = createTestCommand('RecruitAdventurer', {
				name: 'Test Adventurer',
				traits: []
			});

			await testBusManager.commandBus.dispatch(command);

			const state = testBusManager.getState();
			expect(state.resources.get('gold')).toBe(50);
			
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			expect(adventurers).toHaveLength(1);
			const adventurer = adventurers[0] as import('../domain/entities/Adventurer').Adventurer;
			expect(adventurer.metadata.name).toBe('Test Adventurer');
		});

		it('should fail when insufficient gold', async () => {
			const initialState = createTestGameState({ 
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

			// Verify no adventurer created
			const adventurers = Array.from(state.entities.values()).filter(e => e.type === 'Adventurer');
			expect(adventurers).toHaveLength(0);
		});
	});
});

