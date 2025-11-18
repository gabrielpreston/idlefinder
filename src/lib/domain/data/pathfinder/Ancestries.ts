/**
 * Pathfinder Ancestries - Canonical ancestry definitions
 * All terminology validated against official Pathfinder 2E Player Core
 */

/**
 * Pathfinder Ancestry Definition
 */
export interface PathfinderAncestry {
	name: string;
}

/**
 * Pathfinder Ancestries - MVP Core Set (8 ancestries)
 * From Player Core: Dwarf, Elf, Gnome, Goblin, Halfling, Human, Leshy, Orc
 * Note: Tiefling is a versatile heritage (Nephilim) in Player Core, but included in MVP per plan
 */
export const PATHFINDER_ANCESTRIES = {
	dwarf: { name: 'Dwarf' },
	elf: { name: 'Elf' },
	gnome: { name: 'Gnome' },
	goblin: { name: 'Goblin' },
	halfling: { name: 'Halfling' },
	human: { name: 'Human' },
	orc: { name: 'Orc' },
	tiefling: { name: 'Tiefling' }
} as const;

/**
 * Pathfinder Ancestry Key - Union type of all valid ancestry keys
 */
export type PathfinderAncestryKey = keyof typeof PATHFINDER_ANCESTRIES;

/**
 * Get all ancestry keys as an array
 */
export function getPathfinderAncestryKeys(): PathfinderAncestryKey[] {
	return Object.keys(PATHFINDER_ANCESTRIES) as PathfinderAncestryKey[];
}

/**
 * Get a random ancestry key
 */
export function getRandomPathfinderAncestryKey(): PathfinderAncestryKey {
	const keys = getPathfinderAncestryKeys();
	return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Get ancestry definition by key
 */
export function getPathfinderAncestry(key: PathfinderAncestryKey): PathfinderAncestry {
	return PATHFINDER_ANCESTRIES[key];
}

