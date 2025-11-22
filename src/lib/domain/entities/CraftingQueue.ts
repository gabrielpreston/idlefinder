/**
 * Crafting Queue Entity - Manages crafting jobs
 * Per Systems Primitives Spec and plan Phase 3.2
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { CraftingQueueAttributes } from '../attributes/CraftingQueueAttributes';
import type { CraftingQueueState } from '../states/CraftingQueueState';
import type { Entity } from '../primitives/Requirement';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type CraftingQueueId = Identifier<'CraftingQueueId'>;

/**
 * Crafting Queue Entity - Per plan Phase 3.2
 * Stores queue as array of job IDs in metadata (jobs are separate entities)
 */
export class CraftingQueue implements Entity {
	private readonly _id: CraftingQueueId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'CraftingQueue' as const;
	readonly attributes: CraftingQueueAttributes;
	readonly tags: ReadonlyArray<string>;
	state: CraftingQueueState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: CraftingQueueId,
		attributes: CraftingQueueAttributes,
		tags: string[] = [],
		state: CraftingQueueState = 'Active',
		timers: Record<string, number | null> = {},
		metadata: EntityMetadata = {}
	) {
		this._id = id;
		this.id = id.value; // String ID for Entity interface
		this.attributes = attributes;
		this.tags = [...tags]; // Create copy for immutability
		this.state = state;
		this.timers = { ...timers }; // Create copy
		// Ensure metadata.loreTags is copied for immutability if present
		this.metadata = metadata.loreTags
			? { ...metadata, loreTags: [...metadata.loreTags] }
			: { ...metadata }; // Create copy

		// Initialize queue and activeJobs arrays in metadata if not present
		if (!this.metadata.queue) {
			this.metadata.queue = [];
		}
		if (!this.metadata.activeJobs) {
			this.metadata.activeJobs = [];
		}
	}

	/**
	 * Get queue of job IDs
	 */
	getQueue(): string[] {
		return this.metadata.queue as string[];
	}

	/**
	 * Add job ID to queue
	 */
	addJob(jobId: string): void {
		const queue = this.getQueue();
		queue.push(jobId);
		this.metadata.queue = queue;
	}

	/**
	 * Remove job ID from queue
	 */
	removeJob(jobId: string): void {
		const queue = this.getQueue();
		const index = queue.indexOf(jobId);
		if (index > -1) {
			queue.splice(index, 1);
			this.metadata.queue = queue;
		}
	}

	/**
	 * Get active job IDs (jobs in progress)
	 */
	getActiveJobIds(): string[] {
		return this.metadata.activeJobs as string[];
	}

	/**
	 * Add active job ID
	 */
	addActiveJob(jobId: string): void {
		const activeJobs = this.getActiveJobIds();
		if (!activeJobs.includes(jobId)) {
			activeJobs.push(jobId);
			this.metadata.activeJobs = activeJobs;
		}
	}

	/**
	 * Remove active job ID
	 */
	removeActiveJob(jobId: string): void {
		const activeJobs = this.getActiveJobIds();
		const index = activeJobs.indexOf(jobId);
		if (index > -1) {
			activeJobs.splice(index, 1);
			this.metadata.activeJobs = activeJobs;
		}
	}

	/**
	 * Check if queue has available slot
	 */
	hasAvailableSlot(): boolean {
		return this.getActiveJobIds().length < this.attributes.activeSlots;
	}

	/**
	 * Create default crafting queue
	 */
	static createDefault(id: CraftingQueueId): CraftingQueue {
		return new CraftingQueue(
			id,
			{
				activeSlots: 1 // Default: 1 concurrent crafting slot
			},
			['crafting-queue'],
			'Active',
			{},
			{ displayName: 'Crafting Queue', queue: [], activeJobs: [] }
		);
	}
}

