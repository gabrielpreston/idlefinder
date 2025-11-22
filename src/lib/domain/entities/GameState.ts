/**
 * GameState Entity - Replaces PlayerState with entity map structure
 * Per Systems Primitives Spec: Entity map allows systems to reason over type, attributes, tags, state
 */

import type { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import type { Entity } from '../primitives/Requirement';

/**
 * GameState - Single source of truth using entity map structure
 * Replaces PlayerState flat array structure
 */
export class GameState {
	readonly playerId: string;
	readonly lastPlayed: Timestamp;
	entities: Map<string, Entity>; // All entities by ID (Adventurer, Mission, Facility) - mutable for state updates
	readonly resources: ResourceBundle; // Global resources (gold, fame, etc.)

	constructor(
		playerId: string,
		lastPlayed: Timestamp,
		entities: Map<string, Entity> = new Map(),
		resources: ResourceBundle = new ResourceBundle(new Map())
	) {
		this.playerId = playerId;
		this.lastPlayed = lastPlayed;
		this.entities = new Map(entities); // Create copy
		this.resources = resources; // ResourceBundle is immutable
	}

	/**
	 * Get entity by ID
	 */
	getEntity(id: string): Entity | undefined {
		return this.entities.get(id);
	}

	/**
	 * Get all entities of a specific type
	 * @deprecated Use EntityQueryBuilder.byType() instead. This method will be removed in a future version.
	 */
	getEntitiesByType<T extends Entity>(type: string): T[] {
		return Array.from(this.entities.values()).filter(
			(entity) => entity.type === type
		) as T[];
	}

	/**
	 * Add or update entity
	 */
	setEntity(entity: Entity): void {
		this.entities.set(entity.id, entity);
	}

	/**
	 * Remove entity
	 */
	removeEntity(id: string): void {
		this.entities.delete(id);
	}

	/**
	 * Update resources
	 */
	updateResources(newResources: ResourceBundle): GameState {
		return new GameState(this.playerId, this.lastPlayed, this.entities, newResources);
	}

	/**
	 * Update last played timestamp
	 */
	updateLastPlayed(timestamp: Timestamp): GameState {
		return new GameState(this.playerId, timestamp, this.entities, this.resources);
	}
}

