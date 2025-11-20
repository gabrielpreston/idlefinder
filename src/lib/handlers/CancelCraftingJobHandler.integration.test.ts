/**
 * CancelCraftingJobHandler Integration Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupIntegrationTest, createTestCommand, createTestGameState } from '../test-utils';
import type { BusManager } from '../bus/BusManager';
import { CraftingJob } from '../domain/entities/CraftingJob';
import { Identifier } from '../domain/valueObjects/Identifier';
import type { Entity } from '../domain/primitives/Requirement';

describe('CancelCraftingJobHandler Integration', () => {
	let busManager: BusManager;

	beforeEach(() => {
		({ busManager } = setupIntegrationTest({
			eventTypes: []
		}));
	});

	describe('CancelCraftingJob command', () => {
		it('should cancel queued job', async () => {
			const jobId = Identifier.generate<'CraftingJobId'>();
			const job = new CraftingJob(
				jobId,
				{ recipeId: 'recipe-1', status: 'queued' },
				[],
				'queued',
				{},
				{}
			);
			const entities = new Map<string, Entity>(busManager.getState().entities);
			entities.set(job.id, job);
			busManager.setState(createTestGameState({ entities }));

			const command = createTestCommand('CancelCraftingJob', {
				jobId: job.id
			});

			await busManager.commandBus.dispatch(command);

			const state = busManager.getState();
			expect(state.entities.has(job.id)).toBe(false);
		});

		it('should handle non-existent job gracefully', async () => {
			const command = createTestCommand('CancelCraftingJob', {
				jobId: 'nonexistent'
			});

			await busManager.commandBus.dispatch(command);

			// Should not throw, just do nothing
			const state = busManager.getState();
			expect(state).toBeDefined();
		});
	});
});

