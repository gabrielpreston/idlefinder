/**
 * GameState DTO - Data Transfer Object for persistence
 * Serializable representation of GameState with entity map structure
 */

/**
 * Entity DTO - serializable representation of an entity
 */
export interface EntityDTO {
	id: string;
	type: string;
	attributes: Record<string, unknown>;
	tags: string[];
	state: string;
	timers: Record<string, number>; // Timestamps as milliseconds
	metadata: Record<string, unknown>;
}

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

