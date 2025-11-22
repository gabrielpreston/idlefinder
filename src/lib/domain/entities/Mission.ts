/**
 * Mission Entity - Exactly per Systems Primitives Spec section 10.2
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { MissionAttributes } from '../attributes/MissionAttributes';
import type { MissionState } from '../states/MissionState';
import type { Entity } from '../primitives/Requirement';
import { validateEntity } from '../primitives/EntityValidation';
import type { EntityMetadata } from '../primitives/EntityMetadata';
import { validateTimerRelationship } from '../primitives/TimerValidator';

export type MissionId = Identifier<'MissionId'>;

/**
 * Mission Entity - Per spec section 10.2
 */
export class Mission implements Entity {
	private readonly _id: MissionId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'Mission' as const;
	readonly attributes: MissionAttributes;
	readonly tags: ReadonlyArray<string>;
	state: MissionState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: MissionId,
		attributes: MissionAttributes,
		tags: string[] = [],
		state: MissionState = 'Available',
		timers: Record<string, number | null> = {},
		metadata: EntityMetadata = {}
	) {
		// Validate entity
		validateEntity(id.value, 'Mission');

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
	 * Start mission
	 * State transition: Available -> InProgress
	 * Sets startedAt and endsAt timers (stores as milliseconds)
	 */
	start(startedAt: Timestamp, endsAt: Timestamp): void {
		if (this.state !== 'Available') {
			throw new Error(`Cannot start mission: mission state is ${this.state}`);
		}
		
		// Validate timer relationship using TimerValidator
		const validation = validateTimerRelationship(startedAt, endsAt, 'before');
		if (!validation.isValid) {
			throw new Error(`Invalid timer relationship: ${validation.error ?? 'unknown error'}`);
		}
		
		this.state = 'InProgress';
		this.timers['startedAt'] = startedAt.value; // Store as milliseconds
		this.timers['endsAt'] = endsAt.value; // Store as milliseconds
	}

	/**
	 * Complete mission
	 * State transition: InProgress -> Completed
	 * Stores completedAt as milliseconds
	 */
	complete(completedAt: Timestamp): void {
		if (this.state !== 'InProgress') {
			throw new Error(`Cannot complete mission: mission state is ${this.state}`);
		}
		this.state = 'Completed';
		this.timers['completedAt'] = completedAt.value; // Store as milliseconds
	}

	/**
	 * Expire mission
	 * State transition: Available/InProgress -> Expired
	 */
	expire(): void {
		if (this.state === 'Completed') {
			throw new Error(`Cannot expire completed mission`);
		}
		this.state = 'Expired';
	}
}

