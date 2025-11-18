/**
 * Adventurer Entity - Exactly per Systems Primitives Spec section 10.1
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { AdventurerAttributes } from '../attributes/AdventurerAttributes';
import type { AdventurerState } from '../states/AdventurerState';
import type { Entity } from '../primitives/Requirement';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type AdventurerId = Identifier<'AdventurerId'>;

/**
 * Adventurer Entity - Per spec section 10.1
 */
export class Adventurer implements Entity {
	private readonly _id: AdventurerId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'Adventurer' as const;
	readonly attributes: AdventurerAttributes;
	readonly tags: ReadonlyArray<string>;
	state: AdventurerState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: AdventurerId,
		attributes: AdventurerAttributes,
		tags: string[] = [],
		state: AdventurerState = 'Idle',
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
	 * Assign adventurer to a mission
	 * State transition: Idle -> OnMission
	 */
	assignToMission(missionId: Identifier<'MissionId'>): void {
		if (this.state !== 'Idle') {
			throw new Error(`Cannot assign adventurer to mission: adventurer state is ${this.state}`);
		}
		this.state = 'OnMission';
		// Store mission ID in metadata for reference
		this.metadata.currentMissionId = missionId.value;
	}

	/**
	 * Complete mission and return to idle
	 * State transition: OnMission -> Idle
	 */
	completeMission(): void {
		if (this.state !== 'OnMission') {
			throw new Error(`Cannot complete mission: adventurer state is ${this.state}`);
		}
		this.state = 'Idle';
		delete this.metadata.currentMissionId;
	}

	/**
	 * Apply XP to adventurer
	 * Updates attributes.xp (mutable property)
	 */
	applyXP(amount: number): void {
		if (amount < 0) {
			throw new Error(`Cannot apply negative XP: ${amount}`);
		}
		this.attributes.xp += amount;
	}

	/**
	 * Level up adventurer
	 * Increments level and recalculates abilityMods if needed
	 */
	levelUp(): void {
		this.attributes.level += 1;
		// TODO: Recalculate abilityMods based on PF2E progression curves
		// For now, abilityMods remain unchanged
	}

	/**
	 * Assign adventurer to a slot
	 * State transition: Idle -> AssignedToSlot
	 */
	assignToSlot(slotId: Identifier<'SlotId'>): void {
		if (this.state !== 'Idle') {
			throw new Error(`Cannot assign adventurer to slot: adventurer state is ${this.state}`);
		}
		this.state = 'AssignedToSlot';
		this.attributes.assignedSlotId = slotId.value;
	}

	/**
	 * Unassign from slot and return to idle
	 * State transition: AssignedToSlot -> Idle
	 */
	unassignFromSlot(): void {
		if (this.state !== 'AssignedToSlot') {
			throw new Error(`Cannot unassign from slot: adventurer state is ${this.state}`);
		}
		this.state = 'Idle';
		this.attributes.assignedSlotId = null;
	}
}

