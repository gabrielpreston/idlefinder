/**
 * Role Key - Derived from classKey per Systems Primitives Spec section 10.1
 * Spec line 332: roleKey is derived from classKey
 */

import { PATHFINDER_CLASSES, type PathfinderClassKey } from '../data/pathfinder';

export type RoleKey =
	| 'martial_frontliner'
	| 'mobile_striker'
	| 'support_caster'
	| 'skill_specialist'
	| 'ranged_combatant'
	| 'utility_caster';

/**
 * Derive roleKey from classKey
 * Per spec: roleKey is derived from classKey
 * Uses Pathfinder class data as source of truth
 */
export function deriveRoleKey(classKey: string): RoleKey {
	// Normalize classKey to lowercase for lookup
	const normalizedKey = classKey.toLowerCase() as PathfinderClassKey;
	
	// Check if classKey matches a Pathfinder class
	if (normalizedKey in PATHFINDER_CLASSES) {
		return PATHFINDER_CLASSES[normalizedKey].roleKey;
	}
	
	// Fallback to default for unknown classes
	return 'skill_specialist';
}

