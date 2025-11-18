/**
 * Item Entity - Per Systems Primitives Spec and docs/current/11-equipment-auto-equip.md
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { ItemAttributes } from '../attributes/ItemAttributes';
import type { ItemState } from '../states/ItemState';
import type { Entity } from '../primitives/Requirement';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type ItemId = Identifier<'ItemId'>;

/**
 * Item Entity - Per spec section 11
 */
export class Item implements Entity {
	private readonly _id: ItemId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'Item' as const;
	readonly attributes: ItemAttributes;
	readonly tags: ReadonlyArray<string>;
	state: ItemState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: ItemId,
		attributes: ItemAttributes,
		tags: string[] = [],
		state: ItemState = 'InArmory',
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

		// Validate durability
		if (attributes.durability < 0 || attributes.durability > attributes.maxDurability) {
			throw new Error(
				`Item durability (${attributes.durability}) must be between 0 and maxDurability (${attributes.maxDurability})`
			);
		}
	}

	/**
	 * Equip item to an adventurer
	 * State transition: InArmory -> Equipped
	 */
	equip(adventurerId: Identifier<'AdventurerId'>): void {
		if (this.state !== 'InArmory') {
			throw new Error(`Cannot equip item: item state is ${this.state}`);
		}
		if (this.attributes.durability <= 0) {
			throw new Error('Cannot equip broken item');
		}
		this.state = 'Equipped';
		this.metadata.equippedBy = adventurerId.value;
	}

	/**
	 * Unequip item from adventurer
	 * State transition: Equipped -> InArmory
	 */
	unequip(): void {
		if (this.state !== 'Equipped') {
			throw new Error(`Cannot unequip item: item state is ${this.state}`);
		}
		this.state = 'InArmory';
		delete this.metadata.equippedBy;
	}

	/**
	 * Repair item durability
	 * Restores durability to maxDurability
	 */
	repair(): void {
		if (this.attributes.durability >= this.attributes.maxDurability) {
			throw new Error('Item is already at full durability');
		}
		this.attributes.durability = this.attributes.maxDurability;
		if (this.state === 'Broken') {
			this.state = 'InArmory';
		}
	}

	/**
	 * Apply durability damage
	 * Reduces durability, transitions to Broken if durability reaches 0
	 */
	applyDamage(amount: number): void {
		if (amount < 0) {
			throw new Error(`Cannot apply negative damage: ${amount}`);
		}
		this.attributes.durability = Math.max(0, this.attributes.durability - amount);
		if (this.attributes.durability === 0) {
			this.state = 'Broken';
		}
	}

	/**
	 * Check if item is broken
	 */
	isBroken(): boolean {
		return this.attributes.durability <= 0 || this.state === 'Broken';
	}
}

