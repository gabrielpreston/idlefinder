/**
 * Pathfinder Equipment - Canonical equipment item names
 * All terminology validated against official Pathfinder 2E Player Core
 * 
 * Note: Equipment slot names (weapon, armor, offHand) remain generic per plan.
 * Only item names use Pathfinder terminology.
 */

/**
 * Pathfinder Weapon Definition
 */
export interface PathfinderWeapon {
	name: string;
	traits?: readonly string[]; // Weapon traits (e.g., 'agile', 'finesse', 'versatile-p')
}

/**
 * Pathfinder Armor Definition
 */
export interface PathfinderArmor {
	name: string;
	category: 'light' | 'medium' | 'heavy';
}

/**
 * Pathfinder Shield Definition
 */
export interface PathfinderShield {
	name: string;
}

/**
 * Pathfinder Weapons - Core weapon names (MVP set)
 * Reference: Player Core pages 277-281 (Simple Melee, Martial Melee, Ranged Weapons tables)
 */
export const PATHFINDER_WEAPONS = {
	// Simple Melee Weapons
	dagger: { name: 'Dagger', traits: ['agile', 'finesse', 'thrown', 'versatile'] },
	staff: { name: 'Staff', traits: ['monk', 'two-hand'] },
	// Martial Melee Weapons
	longsword: { name: 'Longsword', traits: ['versatile'] },
	shortsword: { name: 'Shortsword', traits: ['agile', 'finesse', 'versatile'] },
	rapier: { name: 'Rapier', traits: ['deadly', 'disarm', 'finesse'] },
	// Ranged Weapons
	longbow: { name: 'Longbow' },
	shortbow: { name: 'Shortbow' },
	crossbow: { name: 'Crossbow' }
} as const;

/**
 * Pathfinder Armor - Core armor names (MVP set)
 * Reference: Player Core page 273 (Armor table)
 */
export const PATHFINDER_ARMOR = {
	// Light Armor
	padded: { name: 'Padded Armor', category: 'light' as const },
	leather: { name: 'Leather', category: 'light' as const },
	studdedLeather: { name: 'Studded Leather', category: 'light' as const },
	chainShirt: { name: 'Chain Shirt', category: 'light' as const },
	// Medium Armor
	hide: { name: 'Hide', category: 'medium' as const },
	scaleMail: { name: 'Scale Mail', category: 'medium' as const },
	chainMail: { name: 'Chain Mail', category: 'medium' as const },
	breastplate: { name: 'Breastplate', category: 'medium' as const },
	// Heavy Armor
	splintMail: { name: 'Splint Mail', category: 'heavy' as const },
	halfPlate: { name: 'Half Plate', category: 'heavy' as const },
	fullPlate: { name: 'Full Plate', category: 'heavy' as const }
} as const;

/**
 * Pathfinder Shields - Core shield names (MVP set)
 * Reference: Player Core page 274 (Shields table)
 */
export const PATHFINDER_SHIELDS = {
	buckler: { name: 'Buckler' },
	woodenShield: { name: 'Wooden Shield' },
	steelShield: { name: 'Steel Shield' },
	towerShield: { name: 'Tower Shield' }
} as const;

/**
 * Pathfinder Weapon Key - Union type of all valid weapon keys
 */
export type PathfinderWeaponKey = keyof typeof PATHFINDER_WEAPONS;

/**
 * Pathfinder Armor Key - Union type of all valid armor keys
 */
export type PathfinderArmorKey = keyof typeof PATHFINDER_ARMOR;

/**
 * Pathfinder Shield Key - Union type of all valid shield keys
 */
export type PathfinderShieldKey = keyof typeof PATHFINDER_SHIELDS;

/**
 * Get weapon definition by key
 */
export function getPathfinderWeapon(key: PathfinderWeaponKey): PathfinderWeapon {
	return PATHFINDER_WEAPONS[key];
}

/**
 * Get armor definition by key
 */
export function getPathfinderArmor(key: PathfinderArmorKey): PathfinderArmor {
	return PATHFINDER_ARMOR[key];
}

/**
 * Get shield definition by key
 */
export function getPathfinderShield(key: PathfinderShieldKey): PathfinderShield {
	return PATHFINDER_SHIELDS[key];
}

