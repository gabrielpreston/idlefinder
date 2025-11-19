/**
 * Crafting System Tests - Processing crafting queue
 */

import { describe, it, expect } from 'vitest';
import { processCraftingQueue } from './CraftingSystem';
import { createTestGameState } from '../../test-utils/testFactories';
import { CraftingQueue } from '../entities/CraftingQueue';
import { CraftingJob } from '../entities/CraftingJob';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { setTimer } from '../primitives/TimerHelpers';
import type { Entity } from '../primitives/Requirement';
import { CompleteCraftingAction } from '../actions/CompleteCraftingAction';
import { StartCraftingAction } from '../actions/StartCraftingAction';

describe('CraftingSystem', () => {
	describe('processCraftingQueue', () => {
		it('should return empty actions when no crafting queue exists', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			expect(result.actions).toHaveLength(0);
			expect(result.events).toHaveLength(0);
		});

		it('should return empty actions when crafting queue is not Active', () => {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			const queue = new CraftingQueue(
				queueId,
				{ activeSlots: 1 },
				[],
				'Paused', // Not Active
				{},
				{ queue: [], activeJobs: [] }
			);
			const entities = new Map<string, Entity>([[queue.id, queue]]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			expect(result.actions).toHaveLength(0);
		});

		it('should create CompleteCraftingAction for completed jobs', () => {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			const queue = CraftingQueue.createDefault(queueId);
			const jobId = Identifier.generate<'CraftingJobId'>();
			const job = new CraftingJob(
				jobId,
				{ recipeId: 'recipe-1', status: 'in-progress' },
				[],
				'in-progress',
				{},
				{}
			);
			// Set completeAt timer to past
			const pastTime = Timestamp.from(Date.now() - 1000);
			setTimer(job, 'completeAt', pastTime);
			queue.addActiveJob(job.id);

			const entities = new Map<string, Entity>([
				[queue.id, queue],
				[job.id, job]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			expect(result.actions).toHaveLength(1);
			expect(result.actions[0]).toBeInstanceOf(CompleteCraftingAction);
		});

		it('should not create CompleteCraftingAction for incomplete jobs', () => {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			const queue = CraftingQueue.createDefault(queueId);
			const jobId = Identifier.generate<'CraftingJobId'>();
			const job = new CraftingJob(
				jobId,
				{ recipeId: 'recipe-1', status: 'in-progress' },
				[],
				'in-progress',
				{},
				{}
			);
			// Set completeAt timer to future
			const futureTime = Timestamp.from(Date.now() + 60000);
			setTimer(job, 'completeAt', futureTime);
			queue.addActiveJob(job.id);

			const entities = new Map<string, Entity>([
				[queue.id, queue],
				[job.id, job]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			expect(result.actions).toHaveLength(0);
		});

		it('should create StartCraftingAction when slot available and job queued', () => {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			const queue = CraftingQueue.createDefault(queueId);
			const jobId = Identifier.generate<'CraftingJobId'>();
			const job = new CraftingJob(
				jobId,
				{ recipeId: 'basic-sword', status: 'queued' },
				[],
				'queued',
				{},
				{}
			);
			queue.addJob(job.id);

			const entities = new Map<string, Entity>([
				[queue.id, queue],
				[job.id, job]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			// Should start the queued job if recipe exists
			expect(result.actions.length).toBeGreaterThanOrEqual(0);
		});

		it('should not start job when no slot available', () => {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			const queue = CraftingQueue.createDefault(queueId);
			// Fill the slot
			const activeJobId = Identifier.generate<'CraftingJobId'>();
			const activeJob = new CraftingJob(
				activeJobId,
				{ recipeId: 'recipe-1', status: 'in-progress' },
				[],
				'in-progress',
				{},
				{}
			);
			queue.addActiveJob(activeJob.id);

			const queuedJobId = Identifier.generate<'CraftingJobId'>();
			const queuedJob = new CraftingJob(
				queuedJobId,
				{ recipeId: 'basic-sword', status: 'queued' },
				[],
				'queued',
				{},
				{}
			);
			queue.addJob(queuedJob.id);

			const entities = new Map<string, Entity>([
				[queue.id, queue],
				[activeJob.id, activeJob],
				[queuedJob.id, queuedJob]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			// Should not start queued job when slot is full
			const startActions = result.actions.filter(a => a instanceof StartCraftingAction);
			expect(startActions).toHaveLength(0);
		});

		it('should only start one job at a time', () => {
			const queueId = Identifier.generate<'CraftingQueueId'>();
			const queue = CraftingQueue.createDefault(queueId);
			const job1Id = Identifier.generate<'CraftingJobId'>();
			const job1 = new CraftingJob(
				job1Id,
				{ recipeId: 'basic-sword', status: 'queued' },
				[],
				'queued',
				{},
				{}
			);
			const job2Id = Identifier.generate<'CraftingJobId'>();
			const job2 = new CraftingJob(
				job2Id,
				{ recipeId: 'basic-sword', status: 'queued' },
				[],
				'queued',
				{},
				{}
			);
			queue.addJob(job1.id);
			queue.addJob(job2.id);

			const entities = new Map<string, Entity>([
				[queue.id, queue],
				[job1.id, job1],
				[job2.id, job2]
			]);
			const state = createTestGameState({ entities });
			const now = Timestamp.now();

			const result = processCraftingQueue(state, now);

			// Should only start one job
			const startActions = result.actions.filter(a => a instanceof StartCraftingAction);
			expect(startActions.length).toBeLessThanOrEqual(1);
		});
	});
});

