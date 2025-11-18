/**
 * Auto-Equip Rules Attributes - Configuration for auto-equip system
 * Per docs/current/11-equipment-auto-equip.md:147-214
 */

import type { RoleKey } from './RoleKey';

export type AutoEquipFocus = 'balanced' | 'offense-first' | 'defense-first';

export type StatPriority = 
	| 'attackBonus'
	| 'damageBonus'
	| 'armorClass'
	| 'damageReduction'
	| 'skillBonus'
	| 'critSafety';

export interface AutoEquipRulesAttributes {
	focus: AutoEquipFocus; // Global priority: balanced, offense-first, defense-first
	allowRareAutoEquip: boolean; // Whether to auto-equip rare items
	rolePriorities: Map<RoleKey, StatPriority[]>; // Role-specific stat priorities
}

