/**
 * Pathfinder Classes - Canonical class definitions with role mappings
 * All terminology validated against official Pathfinder 2E Player Core and supplements
 */

import type { RoleKey } from '../../attributes/RoleKey';

/**
 * Pathfinder Class Definition
 */
export interface PathfinderClass {
	name: string;
	roleKey: RoleKey;
}

/**
 * Pathfinder Classes - MVP Core Set (8 classes)
 * Classes from Player Core: Bard, Cleric, Fighter, Ranger, Rogue, Wizard
 * Additional classes: Alchemist, Barbarian (from Player Core 2 or supplements)
 */
export const PATHFINDER_CLASSES = {
	alchemist: { name: 'Alchemist', roleKey: 'utility_caster' as RoleKey },
	barbarian: { name: 'Barbarian', roleKey: 'martial_frontliner' as RoleKey },
	bard: { name: 'Bard', roleKey: 'support_caster' as RoleKey },
	cleric: { name: 'Cleric', roleKey: 'support_caster' as RoleKey },
	fighter: { name: 'Fighter', roleKey: 'martial_frontliner' as RoleKey },
	ranger: { name: 'Ranger', roleKey: 'ranged_combatant' as RoleKey },
	rogue: { name: 'Rogue', roleKey: 'skill_specialist' as RoleKey },
	wizard: { name: 'Wizard', roleKey: 'utility_caster' as RoleKey }
} as const;

/**
 * Pathfinder Class Key - Union type of all valid class keys
 */
export type PathfinderClassKey = keyof typeof PATHFINDER_CLASSES;

/**
 * Get all class keys as an array
 */
export function getPathfinderClassKeys(): PathfinderClassKey[] {
	return Object.keys(PATHFINDER_CLASSES) as PathfinderClassKey[];
}

/**
 * Get a random class key
 */
export function getRandomPathfinderClassKey(): PathfinderClassKey {
	const keys = getPathfinderClassKeys();
	return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Get class definition by key
 */
export function getPathfinderClass(key: PathfinderClassKey): PathfinderClass {
	return PATHFINDER_CLASSES[key];
}

