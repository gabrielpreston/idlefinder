/**
 * Gate Definition Types
 * 
 * Core type definitions for the gating system.
 * Provides type-safe gate definitions and evaluation results.
 */

/**
 * Gate ID - unique identifier for a gate
 */
export type GateId = string;

/**
 * Gate Type - category of gate
 */
export type GateType =
	| 'ui_panel' // UI panel unlock
	| 'mission_tier' // Mission tier availability
	| 'facility_tier' // Facility tier upgrade limit
	| 'facility_build' // Facility construction unlock
	| 'resource_slot' // Resource slot unlock
	| 'caravan_type' // Caravan type unlock
	| 'crafting_recipe' // Crafting recipe unlock
	| 'region' // Region unlock
	| 'custom'; // Custom game-specific gates

/**
 * Gate Condition - single condition that must be satisfied
 */
export interface GateCondition {
	/**
	 * Condition type identifier
	 */
	type: string;

	/**
	 * Condition parameters (type-specific)
	 */
	params: Record<string, unknown>;

	/**
	 * Human-readable description for UI
	 */
	description?: string;
}

/**
 * Gate Definition - complete gate specification
 */
export interface GateDefinition {
	/**
	 * Unique gate identifier
	 */
	id: GateId;

	/**
	 * Gate type category
	 */
	type: GateType;

	/**
	 * Human-readable name
	 */
	name: string;

	/**
	 * Human-readable description
	 */
	description?: string;

	/**
	 * Conditions that must be satisfied (AND logic)
	 * If empty, gate is always unlocked
	 */
	conditions: GateCondition[];

	/**
	 * Optional: Alternative conditions (OR logic)
	 * If provided, gate unlocks if ANY alternative set is satisfied
	 */
	alternatives?: GateCondition[][];

	/**
	 * Optional: Priority for unlock ordering
	 */
	priority?: number;

	/**
	 * Optional: Metadata for UI/display
	 */
	metadata?: {
		icon?: string;
		category?: string;
		tags?: string[];
	};
}

/**
 * Individual condition evaluation result
 */
export interface ConditionResult {
	condition: GateCondition;
	satisfied: boolean;
	reason?: string;
	progress?: number;
}

/**
 * Gate Evaluation Result
 */
export interface GateEvaluationResult {
	/**
	 * Whether gate is currently unlocked
	 */
	unlocked: boolean;

	/**
	 * Human-readable reason why locked (if locked)
	 */
	unlockReason?: string;

	/**
	 * Progress toward unlock (0-1)
	 */
	progress?: number;

	/**
	 * Details about each condition
	 */
	conditionResults: ConditionResult[];

	/**
	 * Next threshold information (for progress tracking)
	 */
	nextThreshold?: {
		threshold: number;
		current: number;
		remaining: number;
		description: string;
	};
}

