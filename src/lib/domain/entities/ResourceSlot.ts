/**
 * ResourceSlot Entity - Exactly per Systems Primitives Spec section 10.1
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { ResourceSlotAttributes } from '../attributes/ResourceSlotAttributes';
import type { ResourceSlotState } from '../states/ResourceSlotState';
import type { Entity } from '../primitives/Requirement';
import { validateEntity } from '../primitives/EntityValidation';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type SlotId = Identifier<'SlotId'>;

/**
 * ResourceSlot Entity - Per spec section 10.1
 */
export class ResourceSlot implements Entity {
	private readonly _id: SlotId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'ResourceSlot' as const;
	readonly attributes: ResourceSlotAttributes;
	readonly tags: ReadonlyArray<string>;
	state: ResourceSlotState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: SlotId,
		attributes: ResourceSlotAttributes,
		tags: string[] = [],
		state: ResourceSlotState = 'available',
		timers: Record<string, number | null> = {},
		metadata: EntityMetadata = {}
	) {
		// Validate entity
		validateEntity(id.value, 'ResourceSlot');

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
	 * Assign worker to slot
	 * State transition: available -> occupied
	 */
	assignWorker(assigneeType: 'player' | 'adventurer', assigneeId: string | null): void {
		if (this.state !== 'available' && this.state !== 'occupied') {
			throw new Error(`Cannot assign worker to slot: slot state is ${this.state}`);
		}
		this.attributes.assigneeType = assigneeType;
		this.attributes.assigneeId = assigneeId;
		this.state = 'occupied';
	}

	/**
	 * Unassign worker from slot
	 * State transition: occupied -> available
	 */
	unassignWorker(): void {
		if (this.state !== 'occupied') {
			throw new Error(`Cannot unassign worker from slot: slot state is ${this.state}`);
		}
		this.attributes.assigneeType = 'none';
		this.attributes.assigneeId = null;
		this.state = 'available';
	}
}

