/**
 * Pathfinder Traits - Canonical trait definitions
 * All terminology validated against official Pathfinder 2E Player Core
 */

/**
 * Pathfinder Trait - Union type of all valid trait keys
 * Traits are used as string keys in traitTags arrays
 */
export type PathfinderTrait =
	// Magic tradition traits
	| 'arcane'
	| 'divine'
	| 'occult'
	| 'primal'
	// Weapon traits
	| 'agile'
	| 'finesse'
	| 'versatile'
	| 'thrown'
	| 'reach'
	| 'sweep'
	| 'deadly'
	| 'forceful'
	| 'trip'
	| 'disarm'
	| 'shove'
	| 'backswing'
	| 'backstabber'
	| 'parry'
	| 'free-hand'
	| 'nonlethal'
	| 'unarmed'
	| 'monk'
	| 'two-hand'
	| 'jousting'
	| 'fatal'
	| 'propulsive'
	// General traits
	| 'healing'
	| 'ranged'
	| 'melee'
	| 'undead'
	| 'construct'
	| 'beast';

/**
 * Pathfinder Trait Display Names
 * Maps trait keys to human-readable names
 */
export const PATHFINDER_TRAITS: Record<PathfinderTrait, string> = {
	// Magic tradition traits
	arcane: 'Arcane',
	divine: 'Divine',
	occult: 'Occult',
	primal: 'Primal',
	// Weapon traits
	agile: 'Agile',
	finesse: 'Finesse',
	versatile: 'Versatile',
	thrown: 'Thrown',
	reach: 'Reach',
	sweep: 'Sweep',
	deadly: 'Deadly',
	forceful: 'Forceful',
	trip: 'Trip',
	disarm: 'Disarm',
	shove: 'Shove',
	backswing: 'Backswing',
	backstabber: 'Backstabber',
	parry: 'Parry',
	'free-hand': 'Free-Hand',
	nonlethal: 'Nonlethal',
	unarmed: 'Unarmed',
	monk: 'Monk',
	'two-hand': 'Two-Hand',
	jousting: 'Jousting',
	fatal: 'Fatal',
	propulsive: 'Propulsive',
	// General traits
	healing: 'Healing',
	ranged: 'Ranged',
	melee: 'Melee',
	undead: 'Undead',
	construct: 'Construct',
	beast: 'Beast'
} as const;

/**
 * Get trait display name
 */
export function getPathfinderTraitDisplayName(trait: PathfinderTrait): string {
	return PATHFINDER_TRAITS[trait];
}

/**
 * Check if a string is a valid Pathfinder trait
 */
export function isValidPathfinderTrait(trait: string): trait is PathfinderTrait {
	return trait in PATHFINDER_TRAITS;
}

