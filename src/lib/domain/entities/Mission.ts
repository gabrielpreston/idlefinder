/**
 * Mission Entity - Exactly per Systems Primitives Spec section 10.2
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { MissionAttributes } from '../attributes/MissionAttributes';
import type { MissionState } from '../states/MissionState';
import type { Entity } from '../primitives/Requirement';

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
	timers: Map<string, Timestamp>; // Mutable for timer updates
	readonly metadata: Record<string, unknown>;

	constructor(
		id: MissionId,
		attributes: MissionAttributes,
		tags: string[] = [],
		state: MissionState = 'Available',
		timers: Map<string, Timestamp> = new Map(),
		metadata: Record<string, unknown> = {}
	) {
		this._id = id;
		this.id = id.value; // String ID for Entity interface
		this.attributes = attributes;
		this.tags = [...tags]; // Create copy for immutability
		this.state = state;
		this.timers = new Map(timers); // Create copy
		this.metadata = { ...metadata }; // Create copy
	}

	/**
	 * Start mission
	 * State transition: Available -> InProgress
	 * Sets startedAt and endsAt timers
	 */
	start(startedAt: Timestamp, endsAt: Timestamp): void {
		if (this.state !== 'Available') {
			throw new Error(`Cannot start mission: mission state is ${this.state}`);
		}
		if (endsAt.isBefore(startedAt) || endsAt.equals(startedAt)) {
			throw new Error(`endsAt must be after startedAt`);
		}
		this.state = 'InProgress';
		this.timers.set('startedAt', startedAt);
		this.timers.set('endsAt', endsAt);
	}

	/**
	 * Complete mission
	 * State transition: InProgress -> Completed
	 */
	complete(completedAt: Timestamp): void {
		if (this.state !== 'InProgress') {
			throw new Error(`Cannot complete mission: mission state is ${this.state}`);
		}
		this.state = 'Completed';
		this.timers.set('completedAt', completedAt);
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

