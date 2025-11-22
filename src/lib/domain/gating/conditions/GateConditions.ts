/**
 * Gate Condition Factories
 * 
 * Factory functions for creating gate conditions.
 * Follows factory pattern from Requirement.ts
 */

import type { GateCondition } from '../GateDefinition';
import { safeString } from '../../../utils/templateLiterals';

/**
 * Resource-based condition
 * 
 * @param resourceType Resource type (e.g., 'gold', 'fame')
 * @param minAmount Minimum amount required
 * @param description Optional human-readable description
 * @returns GateCondition for resource threshold
 */
export function resourceCondition(
	resourceType: string,
	minAmount: number,
	description?: string
): GateCondition {
	return {
		type: 'resource',
		params: { resourceType, minAmount },
		description:
			description || `Have at least ${safeString(minAmount)} ${safeString(resourceType)}`,
	};
}

/**
 * Entity tier condition
 * 
 * @param entityType Entity type (e.g., 'Facility')
 * @param entityIdOrType Entity ID or type identifier (e.g., 'Guildhall')
 * @param minTier Minimum tier required
 * @param description Optional human-readable description
 * @returns GateCondition for entity tier check
 */
export function entityTierCondition(
	entityType: string,
	entityIdOrType: string,
	minTier: number,
	description?: string
): GateCondition {
	return {
		type: 'entity_tier',
		params: { entityType, entityIdOrType, minTier },
		description:
			description || `${safeString(entityType)} at tier ${safeString(minTier)}+`,
	};
}

/**
 * Entity exists condition
 * 
 * @param entityType Entity type (e.g., 'Facility')
 * @param entityIdOrType Entity ID or type identifier (e.g., 'TrainingGrounds')
 * @param description Optional human-readable description
 * @returns GateCondition for entity existence check
 */
export function entityExistsCondition(
	entityType: string,
	entityIdOrType: string,
	description?: string
): GateCondition {
	return {
		type: 'entity_exists',
		params: { entityType, entityIdOrType },
		description: description || `${entityType} exists`,
	};
}

/**
 * Fame milestone condition
 * 
 * @param minFame Minimum fame required
 * @param description Optional human-readable description
 * @returns GateCondition for fame threshold
 */
export function fameMilestoneCondition(
	minFame: number,
	description?: string
): GateCondition {
	return {
		type: 'fame_milestone',
		params: { minFame },
		description: description || `Reach ${safeString(minFame)} fame`,
	};
}

/**
 * Composite condition: all conditions must be satisfied
 * 
 * @param conditions Array of conditions
 * @returns GateCondition that requires all sub-conditions
 */
export function allConditions(
	...conditions: GateCondition[]
): GateCondition {
	return {
		type: 'all',
		params: { conditions },
		description: 'All conditions must be satisfied',
	};
}

/**
 * Composite condition: any condition must be satisfied
 * 
 * @param conditions Array of conditions
 * @returns GateCondition that requires any sub-condition
 */
export function anyCondition(...conditions: GateCondition[]): GateCondition {
	return {
		type: 'any',
		params: { conditions },
		description: 'Any condition must be satisfied',
	};
}

