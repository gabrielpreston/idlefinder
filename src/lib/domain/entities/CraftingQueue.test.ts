/**
 * CraftingQueue Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { CraftingQueue } from './CraftingQueue';
import { Identifier } from '../valueObjects/Identifier';

function createTestQueue(overrides?: {
	activeSlots?: number;
	state?: 'Active' | 'Paused';
}): CraftingQueue {
	const id = Identifier.generate<'CraftingQueueId'>();
	return new CraftingQueue(
		id,
		{
			activeSlots: overrides?.activeSlots ?? 1
		},
		[],
		overrides?.state || 'Active',
		{},
		{ queue: [], activeJobs: [] }
	);
}

describe('CraftingQueue', () => {
	describe('constructor', () => {
		it('should create valid crafting queue', () => {
			const queue = createTestQueue();
			expect(queue.type).toBe('CraftingQueue');
			expect(queue.attributes.activeSlots).toBe(1);
			expect(queue.state).toBe('Active');
		});

		it('should initialize queue array if not present', () => {
			const id = Identifier.generate<'CraftingQueueId'>();
			const queue = new CraftingQueue(
				id,
				{ activeSlots: 1 },
				[],
				'Active',
				{},
				{} // No queue in metadata
			);

			expect(queue.getQueue()).toEqual([]);
		});
	});

	describe('getQueue', () => {
		it('should return queue array', () => {
			const queue = createTestQueue();
			queue.metadata.queue = ['job-1', 'job-2'];

			expect(queue.getQueue()).toEqual(['job-1', 'job-2']);
		});

		it('should return empty array when queue is undefined', () => {
			const id = Identifier.generate<'CraftingQueueId'>();
			const queue = new CraftingQueue(
				id,
				{ activeSlots: 1 },
				[],
				'Active',
				{},
				{ queue: undefined }
			);

			expect(queue.getQueue()).toEqual([]);
		});
	});

	describe('addJob', () => {
		it('should add job ID to queue', () => {
			const queue = createTestQueue();

			queue.addJob('job-1');

			expect(queue.getQueue()).toEqual(['job-1']);
		});

		it('should add multiple jobs in order', () => {
			const queue = createTestQueue();

			queue.addJob('job-1');
			queue.addJob('job-2');

			expect(queue.getQueue()).toEqual(['job-1', 'job-2']);
		});
	});

	describe('removeJob', () => {
		it('should remove job ID from queue', () => {
			const queue = createTestQueue();
			queue.addJob('job-1');
			queue.addJob('job-2');

			queue.removeJob('job-1');

			expect(queue.getQueue()).toEqual(['job-2']);
		});

		it('should handle removing non-existent job gracefully', () => {
			const queue = createTestQueue();
			queue.addJob('job-1');

			queue.removeJob('job-2');

			expect(queue.getQueue()).toEqual(['job-1']);
		});
	});

	describe('getActiveJobIds', () => {
		it('should return active job IDs', () => {
			const queue = createTestQueue();
			queue.metadata.activeJobs = ['job-1', 'job-2'];

			expect(queue.getActiveJobIds()).toEqual(['job-1', 'job-2']);
		});

		it('should return empty array when activeJobs is undefined', () => {
			const id = Identifier.generate<'CraftingQueueId'>();
			const queue = new CraftingQueue(
				id,
				{ activeSlots: 1 },
				[],
				'Active',
				{},
				{ activeJobs: undefined }
			);

			expect(queue.getActiveJobIds()).toEqual([]);
		});
	});

	describe('addActiveJob', () => {
		it('should add active job ID', () => {
			const queue = createTestQueue();

			queue.addActiveJob('job-1');

			expect(queue.getActiveJobIds()).toEqual(['job-1']);
		});

		it('should not add duplicate active job', () => {
			const queue = createTestQueue();
			queue.addActiveJob('job-1');

			queue.addActiveJob('job-1');

			expect(queue.getActiveJobIds()).toEqual(['job-1']);
		});
	});

	describe('removeActiveJob', () => {
		it('should remove active job ID', () => {
			const queue = createTestQueue();
			queue.addActiveJob('job-1');
			queue.addActiveJob('job-2');

			queue.removeActiveJob('job-1');

			expect(queue.getActiveJobIds()).toEqual(['job-2']);
		});
	});

	describe('hasAvailableSlot', () => {
		it('should return true when slots available', () => {
			const queue = createTestQueue({ activeSlots: 2 });

			expect(queue.hasAvailableSlot()).toBe(true);
		});

		it('should return false when all slots occupied', () => {
			const queue = createTestQueue({ activeSlots: 1 });
			queue.addActiveJob('job-1');

			expect(queue.hasAvailableSlot()).toBe(false);
		});
	});

	describe('createDefault', () => {
		it('should create default queue', () => {
			const id = Identifier.generate<'CraftingQueueId'>();
			const queue = CraftingQueue.createDefault(id);

			expect(queue.attributes.activeSlots).toBe(1);
			expect(queue.state).toBe('Active');
			expect(queue.getQueue()).toEqual([]);
			expect(queue.getActiveJobIds()).toEqual([]);
		});
	});
});

