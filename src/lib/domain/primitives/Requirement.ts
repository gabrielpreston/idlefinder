/**
 * Requirements System - Pure predicates for action validation
 * Per Systems Primitives Spec section 6: Requirements are pure predicates (boolean checks)
 * over entities, resources, state, timers, or tags.
 */

import type { Timestamp } from '../valueObjects/Timestamp';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';

/**
 * Base entity type - all entities must have id and type
 * id is string for map key compatibility, but entities can use Identifier internally
 */
export interface Entity {
	readonly id: string; // String ID for map compatibility (Identifier.value)
	readonly type: string;
}

/**
 * Context provided to requirements for evaluation
 */
export interface RequirementContext {
	/**
	 * Map of all entities by ID
	 */
	entities: Map<string, Entity>;
	/**
	 * Global resources (gold, fame, etc.)
	 */
	resources: ResourceBundle;
	/**
	 * Current time for timer checks
	 */
	currentTime: Timestamp;
	/**
	 * Action-specific parameters
	 */
	actionParams?: Record<string, unknown>;
}

/**
 * Result of requirement evaluation
 */
export interface RequirementResult {
	/**
	 * Whether the requirement is satisfied
	 */
	satisfied: boolean;
	/**
	 * Reason for failure (if not satisfied)
	 */
	reason?: string;
}

/**
 * Requirement type - pure function that evaluates a condition
 */
export type Requirement = (context: RequirementContext) => RequirementResult;

/**
 * Composite requirement: all requirements must be satisfied
 */
export function allRequirements(...requirements: Requirement[]): Requirement {
	return (context: RequirementContext): RequirementResult => {
		for (const requirement of requirements) {
			const result = requirement(context);
			if (!result.satisfied) {
				return result;
			}
		}
		return { satisfied: true };
	};
}

/**
 * Composite requirement: any requirement must be satisfied
 */
export function anyRequirement(...requirements: Requirement[]): Requirement {
	return (context: RequirementContext): RequirementResult => {
		const reasons: string[] = [];
		for (const requirement of requirements) {
			const result = requirement(context);
			if (result.satisfied) {
				return { satisfied: true };
			}
			if (result.reason) {
				reasons.push(result.reason);
			}
		}
		return {
			satisfied: false,
			reason: `None of the requirements were satisfied: ${reasons.join('; ')}`
		};
	};
}

/**
 * Requirement: Entity exists
 */
export function entityExistsRequirement(
	entityId: string,
	entityType?: string
): Requirement {
	return (context: RequirementContext): RequirementResult => {
		const entity = context.entities.get(entityId);
		if (!entity) {
			return {
				satisfied: false,
				reason: `Entity ${entityId} does not exist`
			};
		}
		if (entityType && entity.type !== entityType) {
			return {
				satisfied: false,
				reason: `Entity ${entityId} is not of type ${entityType} (found ${entity.type})`
			};
		}
		return { satisfied: true };
	};
}

/**
 * Requirement: Entity is in required state
 * Note: This is a generic requirement - entity must have a 'state' property
 */
export function entityStateRequirement(
	entityId: string,
	requiredState: string
): Requirement {
	return (context: RequirementContext): RequirementResult => {
		const entity = context.entities.get(entityId);
		if (!entity) {
			return {
				satisfied: false,
				reason: `Entity ${entityId} does not exist`
			};
		}
		// Type assertion needed since Entity interface doesn't include state
		// In practice, entities will have state property
		const entityWithState = entity as Entity & { state: string };
		if (entityWithState.state !== requiredState) {
			return {
				satisfied: false,
				reason: `Entity ${entityId} is not in state ${requiredState} (current: ${entityWithState.state})`
			};
		}
		return { satisfied: true };
	};
}

/**
 * Requirement: Adventurer is idle
 */
export function adventurerIdleRequirement(adventurerId: string): Requirement {
	return entityStateRequirement(adventurerId, 'Idle');
}

/**
 * Requirement: Mission is available
 */
export function missionAvailableRequirement(missionId: string): Requirement {
	return entityStateRequirement(missionId, 'Available');
}

/**
 * Requirement: Resource requirement (e.g., gold >= 100)
 */
export function resourceRequirement(
	resourceType: string,
	minAmount: number
): Requirement {
	return (context: RequirementContext): RequirementResult => {
		const currentAmount = context.resources.get(resourceType);
		if (currentAmount < minAmount) {
			return {
				satisfied: false,
				reason: `Insufficient ${resourceType}: have ${currentAmount}, need ${minAmount}`
			};
		}
		return { satisfied: true };
	};
}

