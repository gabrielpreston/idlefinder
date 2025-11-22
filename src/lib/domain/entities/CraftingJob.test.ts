/**
 * CraftingJob Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { CraftingJob } from './CraftingJob';
import { Identifier } from '../valueObjects/Identifier';

function createTestJob(overrides?: {
	status?: 'queued' | 'in-progress' | 'completed';
}): CraftingJob {
	const id = Identifier.generate<'CraftingJobId'>();
	return new CraftingJob(
		id,
		{
			recipeId: 'recipe-1',
			status: overrides?.status || 'queued'
		},
		[],
		'queued',
		{},
		{}
	);
}

describe('CraftingJob', () => {
	describe('constructor', () => {
		it('should create valid crafting job', () => {
			const job = createTestJob();
			expect(job.type).toBe('CraftingJob');
			expect(job.attributes.status).toBe('queued');
			expect(job.attributes.recipeId).toBe('recipe-1');
		});
	});

	describe('start', () => {
		it('should start queued job', () => {
			const job = createTestJob({ status: 'queued' });
			const startedAt = Date.now();
			const completeAt = startedAt + 60000;

			job.start(startedAt, completeAt);

			expect(job.attributes.status).toBe('in-progress');
			expect(job.timers.startedAt).toBe(startedAt);
			expect(job.timers.completeAt).toBe(completeAt);
		});

		it('should throw error when job is not queued', () => {
			const job = createTestJob({ status: 'in-progress' });

			expect(() => { job.start(Date.now(), Date.now() + 60000); }).toThrow(
				'Cannot start job: job status is in-progress'
			);
		});
	});

	describe('complete', () => {
		it('should complete in-progress job', () => {
			const job = createTestJob({ status: 'in-progress' });

			job.complete();

			expect(job.attributes.status).toBe('completed');
		});

		it('should throw error when job is not in-progress', () => {
			const job = createTestJob({ status: 'queued' });

			expect(() => { job.complete(); }).toThrow('Cannot complete job: job status is queued');
		});
	});
});

