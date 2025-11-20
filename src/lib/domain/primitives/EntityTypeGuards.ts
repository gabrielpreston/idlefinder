/**
 * Entity Type Guards - Reusable type guard functions for entity type checking
 * Provides type-safe entity access without unsafe type assertions
 */

import type { Entity } from './Requirement';
import type { Facility } from '../entities/Facility';
import type { ResourceSlot } from '../entities/ResourceSlot';
import type { Adventurer } from '../entities/Adventurer';
import type { Mission } from '../entities/Mission';
import type { Item } from '../entities/Item';

/**
 * Type guard: Check if entity is Facility
 */
export function isFacility(entity: Entity): entity is Facility {
	return entity.type === 'Facility';
}

/**
 * Type guard: Check if entity is ResourceSlot
 */
export function isResourceSlot(entity: Entity): entity is ResourceSlot {
	return entity.type === 'ResourceSlot';
}

/**
 * Type guard: Check if entity is Adventurer
 */
export function isAdventurer(entity: Entity): entity is Adventurer {
	return entity.type === 'Adventurer';
}

/**
 * Type guard: Check if entity is Mission
 */
export function isMission(entity: Entity): entity is Mission {
	return entity.type === 'Mission';
}

/**
 * Type guard: Check if entity is Item
 */
export function isItem(entity: Entity): entity is Item {
	return entity.type === 'Item';
}

/**
 * Safe entity getter with type guard
 * Returns entity if it matches type, undefined otherwise
 */
export function getEntityAs<T extends Entity>(
	entities: Map<string, Entity>,
	entityId: string,
	typeGuard: (entity: Entity) => entity is T
): T | undefined {
	const entity = entities.get(entityId);
	return entity && typeGuard(entity) ? entity : undefined;
}

