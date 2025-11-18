/**
 * Pathfinder Data - Centralized Pathfinder 2E terminology
 * 
 * This module exports all Pathfinder-specific data definitions:
 * - Classes: Pathfinder class definitions with role mappings
 * - Ancestries: Pathfinder ancestry definitions
 * - Traits: Pathfinder trait definitions and display names
 * - Equipment: Pathfinder equipment item names (weapons, armor, shields)
 * 
 * All terminology is validated against official Pathfinder 2E sources
 */

// Classes
export {
	PATHFINDER_CLASSES,
	type PathfinderClass,
	type PathfinderClassKey,
	getPathfinderClassKeys,
	getRandomPathfinderClassKey,
	getPathfinderClass
} from './Classes';

// Ancestries
export {
	PATHFINDER_ANCESTRIES,
	type PathfinderAncestry,
	type PathfinderAncestryKey,
	getPathfinderAncestryKeys,
	getRandomPathfinderAncestryKey,
	getPathfinderAncestry
} from './Ancestries';

// Traits
export {
	PATHFINDER_TRAITS,
	type PathfinderTrait,
	getPathfinderTraitDisplayName,
	isValidPathfinderTrait
} from './Traits';

// Equipment
export {
	PATHFINDER_WEAPONS,
	PATHFINDER_ARMOR,
	PATHFINDER_SHIELDS,
	type PathfinderWeapon,
	type PathfinderArmor,
	type PathfinderShield,
	type PathfinderWeaponKey,
	type PathfinderArmorKey,
	type PathfinderShieldKey,
	getPathfinderWeapon,
	getPathfinderArmor,
	getPathfinderShield
} from './Equipment';

