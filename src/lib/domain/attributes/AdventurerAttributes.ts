/**
 * Adventurer Attributes - Structured data describing adventurer capabilities
 * Per Systems Primitives Spec section 10.1 lines 296-301
 */

import type { NumericStatMap } from '../valueObjects/NumericStatMap';

export interface AdventurerAttributes {
	level: number;
	xp: number;
	abilityMods: NumericStatMap; // PF2E-style: str, dex, con, int, wis, cha
	classKey: string;
	ancestryKey: string;
	roleTag: string; // e.g., "frontliner", "support", "skirmisher"
	baseHP: number;
}

