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
		if (entity.type === 'Mission') {
			const mission = entity as import('../entities/Mission').Mission;
			if (this.newState === 'InProgress') {
				// Mission.start() requires startedAt and endsAt timers
				// These should be set by SetTimerEffect before this effect runs
				const startedAt = mission.timers.get('startedAt');
				const endsAt = mission.timers.get('endsAt');
				if (startedAt && endsAt) {
					mission.start(startedAt, endsAt);
				} else {
					// Fallback: direct mutation if timers not set yet
					mission.state = this.newState as import('../states/MissionState').MissionState;
				}
			} else if (this.newState === 'Completed') {
				const completedAt = mission.timers.get('endsAt') || mission.timers.get('startedAt');
				if (completedAt) {
					mission.complete(completedAt);
				} else {
					// Fallback: direct mutation
					mission.state = this.newState as import('../states/MissionState').MissionState;
				}
			} else if (this.newState === 'Expired') {
				mission.expire();
			} else {
				mission.state = this.newState as import('../states/MissionState').MissionState;
			}
		} else if (entity.type === 'Adventurer') {
			const adventurer = entity as import('../entities/Adventurer').Adventurer;
			if (this.newState === 'OnMission' && adventurer.state === 'Idle') {
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
					adventurer.assignToMission(missionIdObj);
				} else {
					// Fallback: direct mutation if mission not found
					adventurer.state = this.newState as import('../states/AdventurerState').AdventurerState;
				}
			} else if (this.newState === 'Idle' && adventurer.state === 'OnMission') {
				adventurer.completeMission();
			} else {
				adventurer.state = this.newState as import('../states/AdventurerState').AdventurerState;
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
			
			if (entity.type === 'Adventurer') {
				const adventurer = entity as import('../entities/Adventurer').Adventurer;
				if (attributeName === 'xp' && typeof this.value === 'number') {
					adventurer.attributes.xp = this.value;
				} else if (attributeName === 'level' && typeof this.value === 'number') {
					adventurer.attributes.level = this.value;
				} else {
					// Fallback: direct assignment
					(adventurer.attributes as unknown as Record<string, unknown>)[attributeName] = this.value;
				}
			} else if (entity.type === 'Facility') {
				const facility = entity as import('../entities/Facility').Facility;
				if (attributeName === 'tier' && typeof this.value === 'number') {
					// Use facility.upgrade() method, but we need to set to specific tier
					// For now, upgrade until we reach the target tier
					while (facility.attributes.tier < this.value) {
						facility.upgrade();
					}
				} else {
					// Fallback: direct assignment (may not work if attributes is readonly)
					try {
						(facility.attributes as unknown as Record<string, unknown>)[attributeName] = this.value;
					} catch {
						// Ignore if readonly
					}
				}
			} else {
				// Fallback: direct attribute assignment
				const entityWithAttributes = entity as Entity & Record<string, unknown>;
				const parentObj = entityWithAttributes[parts[0]] as Record<string, unknown>;
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
 * Note: Entity must have a timers Map
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
		// Type assertion - entities will have timers Map
		const entityWithTimers = entity as Entity & {
			timers: Map<string, Timestamp>;
		};
		if (this.timerValue === null) {
			entityWithTimers.timers.delete(this.timerKey);
		} else {
			entityWithTimers.timers.set(this.timerKey, this.timerValue);
		}
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

