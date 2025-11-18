/**
 * Adventurer Attributes - Structured data describing adventurer capabilities
 * Per Systems Primitives Spec section 10.1 lines 296-301
 */

import type { NumericStatMap } from '../valueObjects/NumericStatMap';
import type { RoleKey } from './RoleKey';

export interface AdventurerAttributes {
	level: number;
	xp: number;
	abilityMods: NumericStatMap; // PF2E-style: str, dex, con, int, wis, cha
	classKey: string;
	ancestryKey: string;
	traitTags: string[]; // PF2E-ish mech traits: "arcane", "healing", "finesse" (spec line 331)
	roleKey: RoleKey; // Derived from classKey (spec line 332)
	baseHP: number;
	equipment?: {
		weaponId?: string;
		armorId?: string;
		offHandId?: string;
		accessoryId?: string;
	};
	assignedSlotId: string | null;
}

