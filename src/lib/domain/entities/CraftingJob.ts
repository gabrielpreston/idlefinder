/**
 * Crafting Job Entity - Individual crafting job in queue
 * Per Systems Primitives Spec and plan Phase 3.3
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { CraftingJobAttributes } from '../attributes/CraftingJobAttributes';
import type { Entity } from '../primitives/Requirement';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type CraftingJobId = Identifier<'CraftingJobId'>;

/**
 * Crafting Job Entity - Per plan Phase 3.3
 */
export class CraftingJob implements Entity {
	private readonly _id: CraftingJobId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'CraftingJob' as const;
	readonly attributes: CraftingJobAttributes;
	readonly tags: ReadonlyArray<string>;
	state: string; // Not used for jobs, but required by Entity interface
	timers: Record<string, number | null>; // startedAt, completeAt (milliseconds)
	readonly metadata: EntityMetadata;

	constructor(
		id: CraftingJobId,
		attributes: CraftingJobAttributes,
		tags: string[] = [],
		state: string = 'queued',
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
	}

	/**
	 * Start crafting job
	 */
	start(startedAt: number, completeAt: number): void {
		if (this.attributes.status !== 'queued') {
			throw new Error(`Cannot start job: job status is ${this.attributes.status}`);
		}
		this.attributes.status = 'in-progress';
		this.timers.startedAt = startedAt;
		this.timers.completeAt = completeAt;
	}

	/**
	 * Complete crafting job
	 */
	complete(): void {
		if (this.attributes.status !== 'in-progress') {
			throw new Error(`Cannot complete job: job status is ${this.attributes.status}`);
		}
		this.attributes.status = 'completed';
	}
}

