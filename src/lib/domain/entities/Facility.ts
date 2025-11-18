/**
 * Facility Entity - Exactly per Systems Primitives Spec section 10.3
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { FacilityAttributes } from '../attributes/FacilityAttributes';
import type { FacilityState } from '../states/FacilityState';
import type { Entity } from '../primitives/Requirement';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type FacilityId = Identifier<'FacilityId'>;

/**
 * Facility Entity - Per spec section 10.3
 * Passive effects evaluated by other systems
 */
export class Facility implements Entity {
	private readonly _id: FacilityId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'Facility' as const;
	readonly attributes: FacilityAttributes;
	readonly tags: ReadonlyArray<string>;
	state: FacilityState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: FacilityId,
		attributes: FacilityAttributes,
		tags: string[] = [],
		state: FacilityState = 'Online',
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
	 * Upgrade facility tier
	 * Updates attributes.tier (mutable property)
	 */
	upgrade(): void {
		if (this.state !== 'Online') {
			throw new Error(`Cannot upgrade facility: facility state is ${this.state}`);
		}
		this.attributes.tier += 1;
	}

	/**
	 * Get active effects for current tier
	 * Passive effects evaluated by other systems (per spec lines 467-480)
	 */
	getActiveEffects(): {
		rosterCap?: number;
		maxActiveMissions?: number;
		trainingMultiplier?: number;
		resourceStorageCap?: number;
	} {
		const effects: {
			rosterCap?: number;
			maxActiveMissions?: number;
			trainingMultiplier?: number;
			resourceStorageCap?: number;
		} = {};

		switch (this.attributes.facilityType) {
			case 'Dormitory':
				effects.rosterCap = this.attributes.baseCapacity + this.attributes.tier * 5;
				break;
			case 'MissionCommand':
				effects.maxActiveMissions = this.attributes.baseCapacity + this.attributes.tier;
				break;
			case 'TrainingGrounds':
				effects.trainingMultiplier = this.attributes.bonusMultipliers.xp ?? 1.0;
				break;
			case 'ResourceDepot':
				effects.resourceStorageCap = this.attributes.baseCapacity + this.attributes.tier * 100;
				break;
		}

		return effects;
	}
}

