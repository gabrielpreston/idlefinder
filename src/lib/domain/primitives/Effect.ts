/**
 * Effects System - Data structures describing state and resource changes
 * Per Systems Primitives Spec section 8: Effects are data describing mutations,
 * not imperative logic spread everywhere.
 */

import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Identifier } from '../valueObjects/Identifier';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { NumericStatMap } from '../valueObjects/NumericStatMap';
import type { Entity } from './Requirement';
import { getTimer } from './TimerHelpers';
import { isAdventurer, isFacility, isItem, isMission, isResourceSlot } from './EntityTypeGuards';

/**
 * Result of applying an effect
 */
export interface EffectResult {
	/**
	 * Updated entities (mutated in place)
	 */
	entities: Map<string, Entity>;
	/**
	 * Updated resources
	 */
	resources: ResourceBundle;
}

/**
 * Effect interface - data structure describing a mutation
 */
export interface Effect {
	/**
	 * Applies the effect, mutating entities and resources
	 */
	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult;
}

/**
 * Effect: Modify resources (add or subtract)
 */
export class ModifyResourceEffect implements Effect {
	constructor(
		private readonly resourceUnits: ResourceUnit[],
		private readonly operation: 'add' | 'subtract' = 'add'
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const resourceBundle = ResourceBundle.fromArray(this.resourceUnits);
		const newResources =
			this.operation === 'add'
				? resources.add(resourceBundle)
				: resources.subtract(resourceBundle);
		return {
			entities,
			resources: newResources
		};
	}
}

/**
 * Effect: Set entity state
 * Note: Entity must have a mutable 'state' property
 */
export class SetEntityStateEffect implements Effect {
	constructor(
		private readonly entityId: string,
		private readonly newState: string,
		private readonly missionId?: string // Optional: for adventurer.assignToMission()
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const entity = entities.get(this.entityId);
		if (!entity) {
			throw new Error(`Entity ${this.entityId} not found`);
		}
		
		// Call entity methods for state transitions (per spec: Effects call entity methods)
		if (isMission(entity)) {
			if (this.newState === 'InProgress') {
				// Mission.start() requires startedAt and endsAt timers
				// These should be set by SetTimerEffect before this effect runs
				const startedAt = getTimer(entity, 'startedAt');
				const endsAt = getTimer(entity, 'endsAt');
				if (startedAt && endsAt) {
					entity.start(startedAt, endsAt);
				} else {
					// Fallback: direct mutation if timers not set yet
					entity.state = this.newState as import('../states/MissionState').MissionState;
				}
			} else if (this.newState === 'Completed') {
				const completedAt = getTimer(entity, 'endsAt') || getTimer(entity, 'startedAt');
				if (completedAt) {
					entity.complete(completedAt);
				} else {
					// Fallback: direct mutation
					entity.state = this.newState as import('../states/MissionState').MissionState;
				}
			} else if (this.newState === 'Expired') {
				entity.expire();
			} else {
				entity.state = this.newState as import('../states/MissionState').MissionState;
			}
		} else if (isAdventurer(entity)) {
			if (this.newState === 'OnMission' && entity.state === 'Idle') {
				// Use provided missionId or find it from entities
				const missionIdToUse = this.missionId || (() => {
					for (const [id, e] of entities.entries()) {
						if (e.type === 'Mission') {
							return id;
						}
					}
					return null;
				})();
				
				if (missionIdToUse) {
					const missionIdObj = Identifier.from<'MissionId'>(missionIdToUse);
					entity.assignToMission(missionIdObj);
				} else {
					// Fallback: direct mutation if mission not found
					entity.state = this.newState as import('../states/AdventurerState').AdventurerState;
				}
			} else if (this.newState === 'Idle' && entity.state === 'OnMission') {
				entity.completeMission();
			} else {
				entity.state = this.newState as import('../states/AdventurerState').AdventurerState;
			}
		} else {
			// Fallback for other entity types
			const entityWithState = entity as Entity & { state: string };
			entityWithState.state = this.newState;
		}
		
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Set entity attribute (for value object attributes)
 * Note: Entity must have the specified attribute path
 */
export class SetEntityAttributeEffect implements Effect {
	constructor(
		private readonly entityId: string,
		private readonly attributePath: string,
		private readonly value: NumericStatMap | number | string
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const entity = entities.get(this.entityId);
		if (!entity) {
			throw new Error(`Entity ${this.entityId} not found`);
		}
		
		// Handle nested attribute paths (e.g., 'attributes.xp', 'attributes.tier')
		const parts = this.attributePath.split('.');
		if (parts.length === 2 && parts[0] === 'attributes') {
			const attributeName = parts[1];
			
			if (isAdventurer(entity)) {
				if (attributeName === 'xp' && typeof this.value === 'number') {
					entity.attributes.xp = this.value;
				} else if (attributeName === 'level' && typeof this.value === 'number') {
					entity.attributes.level = this.value;
				} else {
					// Fallback: direct assignment
					(entity.attributes as unknown as Record<string, unknown>)[attributeName] = this.value;
				}
			} else if (isFacility(entity)) {
				if (attributeName === 'tier' && typeof this.value === 'number') {
					// Use facility.upgrade() method, but we need to set to specific tier
					// For now, upgrade until we reach the target tier
					while (entity.attributes.tier < this.value) {
						entity.upgrade();
					}
				} else {
					// Fallback: direct assignment (may not work if attributes is readonly)
					try {
						(entity.attributes as unknown as Record<string, unknown>)[attributeName] = this.value;
					} catch {
						// Ignore if readonly
					}
				}
			} else if (isResourceSlot(entity)) {
				// ResourceSlot attributes can be mutated directly
				if (attributeName === 'fractionalAccumulator' && typeof this.value === 'number') {
					entity.attributes.fractionalAccumulator = this.value;
				} else {
					// Fallback: direct assignment
					(entity.attributes as unknown as Record<string, unknown>)[attributeName] = this.value;
				}
			} else {
				// Fallback: direct attribute assignment
				const entityWithAttributes = entity as Entity & Record<string, unknown>;
				const parentObj = entityWithAttributes[parts[0]] as Record<string, unknown> | undefined;
				if (parentObj) {
					parentObj[parts[1]] = this.value;
				}
			}
		} else {
			// Direct attribute assignment (no nesting)
			const entityWithAttributes = entity as Entity & Record<string, unknown>;
			entityWithAttributes[this.attributePath] = this.value;
		}
		
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Set timer value
 * Note: Entity must have timers Record<string, number | null> (milliseconds per spec)
 */
export class SetTimerEffect implements Effect {
	constructor(
		private readonly entityId: string,
		private readonly timerKey: string,
		private readonly timerValue: Timestamp | null
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const entity = entities.get(this.entityId);
		if (!entity) {
			throw new Error(`Entity ${this.entityId} not found`);
		}
		// Type assertion - entities will have timers Record
		const entityWithTimers = entity as Entity & {
			timers: Record<string, number | null>;
		};
		if (this.timerValue === null) {
			entityWithTimers.timers[this.timerKey] = null;
		} else {
			entityWithTimers.timers[this.timerKey] = this.timerValue.value; // Store as milliseconds
		}
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Set entity metadata field
 * Note: Entity must have a metadata Record<string, unknown>
 * Follows same pattern as SetEntityAttributeEffect
 */
export class SetEntityMetadataEffect implements Effect {
	constructor(
		private readonly entityId: string,
		private readonly metadataKey: string,
		private readonly value: unknown
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const entity = entities.get(this.entityId);
		if (!entity) {
			throw new Error(`Entity ${this.entityId} not found`);
		}
		
		// Update metadata (metadata is mutable per spec)
		// Type assertion: all entities have metadata property
		const entityWithMetadata = entity as Entity & {
			metadata: Record<string, unknown>;
		};
		entityWithMetadata.metadata[this.metadataKey] = this.value;
		
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Add tags to entity
 * Note: Entity must have a tags array
 */
export class AddEntityTagsEffect implements Effect {
	constructor(
		private readonly entityId: string,
		private readonly tagsToAdd: string[]
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const entity = entities.get(this.entityId);
		if (!entity) {
			throw new Error(`Entity ${this.entityId} not found`);
		}
		// Type assertion - entities will have tags array
		const entityWithTags = entity as Entity & {
			tags: string[];
		};
		for (const tag of this.tagsToAdd) {
			if (!entityWithTags.tags.includes(tag)) {
				entityWithTags.tags.push(tag);
			}
		}
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Equip item to adventurer
 * Sets item state to Equipped, updates adventurer.equipment
 */
export class EquipItemEffect implements Effect {
	constructor(
		private readonly itemId: string,
		private readonly adventurerId: string,
		private readonly slot: 'weapon' | 'armor' | 'offHand' | 'accessory'
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const item = entities.get(this.itemId);
		const adventurer = entities.get(this.adventurerId);

		if (!item || !isItem(item)) {
			throw new Error(`Item ${this.itemId} not found`);
		}
		if (!adventurer || !isAdventurer(adventurer)) {
			throw new Error(`Adventurer ${this.adventurerId} not found`);
		}

		// Unequip any existing item in this slot
		const existingItemId = adventurer.attributes.equipment?.[`${this.slot}Id`];
		if (existingItemId) {
			const existingItem = entities.get(existingItemId);
			if (existingItem && isItem(existingItem)) {
				if (existingItem.state === 'Equipped') {
					existingItem.unequip();
				}
			}
		}

		// Equip the new item
		const adventurerIdObj = Identifier.from<'AdventurerId'>(this.adventurerId);
		item.equip(adventurerIdObj);

		// Update adventurer equipment reference
		if (!adventurer.attributes.equipment) {
			adventurer.attributes.equipment = {};
		}
		adventurer.attributes.equipment[`${this.slot}Id`] = this.itemId;

		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Unequip item from adventurer
 * Sets item state to InArmory, clears adventurer.equipment slot
 */
export class UnequipItemEffect implements Effect {
	constructor(
		private readonly itemId: string,
		private readonly adventurerId: string,
		private readonly slot: 'weapon' | 'armor' | 'offHand' | 'accessory'
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const item = entities.get(this.itemId);
		const adventurer = entities.get(this.adventurerId);

		if (!item || !isItem(item)) {
			throw new Error(`Item ${this.itemId} not found`);
		}
		if (!adventurer || !isAdventurer(adventurer)) {
			throw new Error(`Adventurer ${this.adventurerId} not found`);
		}

		// Unequip the item
		if (item.state === 'Equipped') {
			item.unequip();
		}

	// Clear adventurer equipment reference
	if (adventurer.attributes.equipment) {
		const equipment = { ...adventurer.attributes.equipment };
		// Create new object without the slot key
		const { weaponId, armorId, offHandId, accessoryId } = equipment;
		const slotKey = `${this.slot}Id`;
		const newEquipment: typeof adventurer.attributes.equipment = {};
		if (slotKey !== 'weaponId' && weaponId) newEquipment.weaponId = weaponId;
		if (slotKey !== 'armorId' && armorId) newEquipment.armorId = armorId;
		if (slotKey !== 'offHandId' && offHandId) newEquipment.offHandId = offHandId;
		if (slotKey !== 'accessoryId' && accessoryId) newEquipment.accessoryId = accessoryId;
		adventurer.attributes.equipment = Object.keys(newEquipment).length > 0 ? newEquipment : undefined;
	}

		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Repair item durability
 * Restores durability to maxDurability
 */
export class RepairItemEffect implements Effect {
	constructor(private readonly itemId: string) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const item = entities.get(this.itemId);

		if (!item || !isItem(item)) {
			throw new Error(`Item ${this.itemId} not found`);
		}

		item.repair();

		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Salvage item
 * Removes item, adds materials to resources
 */
export class SalvageItemEffect implements Effect {
	constructor(
		private readonly itemId: string,
		private readonly materialsAmount: number = 0
	) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		const item = entities.get(this.itemId);

		if (!item || !isItem(item)) {
			throw new Error(`Item ${this.itemId} not found`);
		}

		// If item is equipped, unequip it first
		if (item.state === 'Equipped') {
			item.unequip();
			// Also clear any adventurer equipment references
			for (const entity of entities.values()) {
				if (isAdventurer(entity)) {
					if (entity.attributes.equipment) {
						const eq = entity.attributes.equipment;
						if (eq.weaponId === this.itemId) delete eq.weaponId;
						if (eq.armorId === this.itemId) delete eq.armorId;
						if (eq.offHandId === this.itemId) delete eq.offHandId;
						if (eq.accessoryId === this.itemId) delete eq.accessoryId;
					}
				}
			}
		}

		// Remove item from entities
		entities.delete(this.itemId);

		// Add materials to resources
		const resourceUnits: ResourceUnit[] = [];
		if (this.materialsAmount > 0) {
			resourceUnits.push(new ResourceUnit('materials', this.materialsAmount));
		}

		const newResources =
			resourceUnits.length > 0
				? resources.add(ResourceBundle.fromArray(resourceUnits))
				: resources;

		return {
			entities,
			resources: newResources
		};
	}
}

/**
 * Effect: Create item and add to entities
 */
export class CreateItemEffect implements Effect {
	constructor(private readonly item: import('../entities/Item').Item) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		entities.set(this.item.id, this.item);
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Create facility and add to entities
 */
export class CreateFacilityEffect implements Effect {
	constructor(private readonly facility: import('../entities/Facility').Facility) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		entities.set(this.facility.id, this.facility);
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Create mission and add to entities
 */
export class CreateMissionEffect implements Effect {
	constructor(private readonly mission: import('../entities/Mission').Mission) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		entities.set(this.mission.id, this.mission);
		return {
			entities,
			resources
		};
	}
}

/**
 * Effect: Create resource slot and add to entities
 */
export class CreateResourceSlotEffect implements Effect {
	constructor(private readonly slot: import('../entities/ResourceSlot').ResourceSlot) {}

	apply(entities: Map<string, Entity>, resources: ResourceBundle): EffectResult {
		entities.set(this.slot.id, this.slot);
		return {
			entities,
			resources
		};
	}
}

/**
 * Applies a sequence of effects in order
 */
export function applyEffects(
	effects: Effect[],
	entities: Map<string, Entity>,
	resources: ResourceBundle
): EffectResult {
	let currentEntities = entities;
	let currentResources = resources;

	for (const effect of effects) {
		const result = effect.apply(currentEntities, currentResources);
		currentEntities = result.entities;
		currentResources = result.resources;
	}

	return {
		entities: currentEntities,
		resources: currentResources
	};
}

