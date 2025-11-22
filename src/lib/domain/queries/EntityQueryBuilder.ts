/**
 * Entity Query Builder - Standardized entity filtering queries
 * 
 * Replaces repeated pattern: Array.from(state.entities.values()).filter(...)
 * Provides composable query functions for filtering entities by type, state, attributes, and custom predicates.
 */

import type { GameState } from '../entities/GameState';
import type { Entity } from '../primitives/Requirement';
import type { Query } from './Query';

/**
 * Entity Query Builder - Functions for creating entity queries
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace EntityQueryBuilder {
	/**
	 * Query entities by type
	 * 
	 * @template T Entity type
	 * @param type Entity type string (e.g., 'Adventurer', 'Mission', 'Facility')
	 * @returns Query that returns all entities of the specified type
	 */
	export function byType<T extends Entity>(type: string): Query<T[]> {
		return (state: GameState): T[] => {
			return Array.from(state.entities.values()).filter(
				(entity) => entity.type === type
			) as T[];
		};
	}

	/**
	 * Query entities by state
	 * 
	 * @template T Entity type
	 * @param state Entity state string (e.g., 'Idle', 'OnMission', 'Available')
	 * @returns Query that returns all entities in the specified state
	 */
	export function byState<T extends Entity>(state: string): Query<T[]> {
		return (gameState: GameState): T[] => {
			return Array.from(gameState.entities.values()).filter(
				(entity) => {
					const entityWithState = entity as Entity & { state?: string };
					return entityWithState.state === state;
				}
			) as T[];
		};
	}

	/**
	 * Query entities by attribute value
	 * 
	 * @template T Entity type
	 * @param attrPath Attribute path (e.g., 'attributes.tier', 'attributes.level')
	 * @param value Value to match
	 * @returns Query that returns all entities with matching attribute value
	 */
	export function byAttribute<T extends Entity>(attrPath: string, value: unknown): Query<T[]> {
		return (state: GameState): T[] => {
			return Array.from(state.entities.values()).filter(
				(entity) => {
					const parts = attrPath.split('.');
					let current: unknown = entity;
					
					for (const part of parts) {
						if (current && typeof current === 'object' && part in current) {
							current = (current as Record<string, unknown>)[part];
						} else {
							return false;
						}
					}
					
					return current === value;
				}
			) as T[];
		};
	}

	/**
	 * Query entities using a custom predicate
	 * 
	 * @template T Entity type
	 * @param predicate Function that returns true for entities to include
	 * @returns Query that returns all entities matching the predicate
	 */
	export function where<T extends Entity>(predicate: (entity: Entity) => entity is T): Query<T[]> {
		return (state: GameState): T[] => {
			return Array.from(state.entities.values()).filter(predicate);
		};
	}

	/**
	 * Query entities using a custom predicate (non-type-guard version)
	 * 
	 * @template T Entity type
	 * @param predicate Function that returns true for entities to include
	 * @returns Query that returns all entities matching the predicate
	 */
	export function filter<T extends Entity>(predicate: (entity: Entity) => boolean): Query<T[]> {
		return (state: GameState): T[] => {
			return Array.from(state.entities.values()).filter(predicate) as T[];
		};
	}
}

