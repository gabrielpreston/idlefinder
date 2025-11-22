/**
 * GameState DTO - Data Transfer Object for persistence
 * Serializable representation of GameState with entity map structure
 */

import type { EntityDTO } from '../schemas/EntitySchema';

/**
 * Entity DTO - serializable representation of an entity
 * Re-exported from EntitySchema to use Zod-inferred type as single source of truth
 */
export type { EntityDTO };

/**
 * ResourceBundle DTO - serializable representation of resources
 */
export interface ResourceBundleDTO {
	resources: Record<string, number>;
}

/**
 * GameState DTO - serializable representation of GameState
 */
export interface GameStateDTO {
	version: number;
	playerId: string;
	lastPlayed: string; // ISO timestamp UTC
	entities: EntityDTO[];
	resources: ResourceBundleDTO;
}

