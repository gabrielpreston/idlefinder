/**
 * Role Key - Derived from classKey per Systems Primitives Spec section 10.1
 * Spec line 332: roleKey is derived from classKey
 */

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
 */
export function deriveRoleKey(classKey: string): RoleKey {
	// Default mapping - can be expanded later
	const roleMap: Record<string, RoleKey> = {
		fighter: 'martial_frontliner',
		paladin: 'martial_frontliner',
		monk: 'mobile_striker',
		rogue: 'skill_specialist',
		cleric: 'support_caster',
		wizard: 'utility_caster',
		ranger: 'ranged_combatant'
	};
	return roleMap[classKey.toLowerCase()] || 'skill_specialist';
}

