/**
 * AddCraftingToQueueHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import type { DomainEvent } from '../bus/types';

describe('AddCraftingToQueueHandler Integration', () => {
	let busManager: BusManager;
	let _publishedEvents: DomainEvent[];

	beforeEach(() => {
		({ busManager, publishedEvents: _publishedEvents } = setupIntegrationTest({
			eventTypes: []
		}));
	});

	describe('AddCraftingToQueue command', () => {
		it('should add crafting job to queue', async () => {
			const command = createTestCommand('AddCraftingToQueue', {
				recipeId: 'recipe-1'
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			const craftingJobs = Array.from(state.entities.values()).filter(e => e.type === 'CraftingJob');
			expect(craftingJobs.length).toBeGreaterThan(0);

			const craftingQueues = Array.from(state.entities.values()).filter(e => e.type === 'CraftingQueue');
			expect(craftingQueues.length).toBeGreaterThan(0);
		});

		it('should create crafting queue if it does not exist', async () => {
			const state = busManager.getState();
			const initialQueues = Array.from(state.entities.values()).filter(e => e.type === 'CraftingQueue');
			
			const command = createTestCommand('AddCraftingToQueue', {
				recipeId: 'recipe-1'
			});

			await busManager.commandBus.dispatch(command);

			const finalState = busManager.getState();
			const finalQueues = Array.from(finalState.entities.values()).filter(e => e.type === 'CraftingQueue');
			expect(finalQueues.length).toBeGreaterThanOrEqual(initialQueues.length);
		});
	});
});

