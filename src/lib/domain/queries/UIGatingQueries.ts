/**
 * UI Gating Queries
 * 
 * Queries for determining UI panel unlock status and progression gating.
 * Supports the MVP progression: Tier 0 → Tier 1 → First Adventurer → Facilities
 * 
 * Now uses centralized gating system while maintaining backward compatibility.
 */

import type { GameState } from '../entities/GameState';
import { hasAnyAdventurers } from './AdventurerQueries';
import { isGateUnlocked, getGateUnlockReason } from '../gating/GateQueries';
// Ensure gates are registered when this module loads
import '../gating';

/**
 * Panel ID constants
 */
export const PANEL_IDS = {
	DASHBOARD: 'dashboard',
	ADVENTURERS: 'adventurers',
	MISSIONS: 'missions',
	FACILITIES: 'facilities',
	EQUIPMENT: 'equipment',
	CRAFTING: 'crafting',
	DOCTRINE: 'doctrine'
} as const;

/**
 * Check if Adventurers panel is unlocked
 * 
 * Unlocked when guildhall reaches Tier 1
 * 
 * @param state GameState
 * @returns True if panel is unlocked
 */
export function isAdventurersPanelUnlocked(state: GameState): boolean {
	return isGateUnlocked('ui_panel_adventurers', state);
}

/**
 * Check if Missions panel is unlocked
 * 
 * Unlocked when guildhall reaches Tier 1
 * 
 * @param state GameState
 * @returns True if panel is unlocked
 */
export function isMissionsPanelUnlocked(state: GameState): boolean {
	return isGateUnlocked('ui_panel_missions', state);
}

/**
 * Check if Missions panel is functional
 * 
 * Functional when at least one adventurer exists
 * 
 * @param state GameState
 * @returns True if panel is functional
 */
export function isMissionsPanelFunctional(state: GameState): boolean {
	return hasAnyAdventurers(state);
}

/**
 * Check if Facilities panel is unlocked
 * 
 * Unlocked when guildhall reaches Tier 0
 * 
 * @param state GameState
 * @returns True if panel is unlocked
 */
export function isFacilitiesPanelUnlocked(state: GameState): boolean {
	return isGateUnlocked('ui_panel_facilities', state);
}

/**
 * Check if Equipment panel is unlocked
 * 
 * Unlocked when guildhall reaches Tier 2
 * 
 * @param state GameState
 * @returns True if panel is unlocked
 */
export function isEquipmentPanelUnlocked(state: GameState): boolean {
	return isGateUnlocked('ui_panel_equipment', state);
}

/**
 * Check if Crafting panel is unlocked
 * 
 * Unlocked when guildhall reaches Tier 3
 * 
 * @param state GameState
 * @returns True if panel is unlocked
 */
export function isCraftingPanelUnlocked(state: GameState): boolean {
	return isGateUnlocked('ui_panel_crafting', state);
}

/**
 * Check if Doctrine panel is unlocked
 * 
 * Unlocked when guildhall reaches Tier 4
 * 
 * @param state GameState
 * @returns True if panel is unlocked
 */
export function isDoctrinePanelUnlocked(state: GameState): boolean {
	return isGateUnlocked('ui_panel_doctrine', state);
}

/**
 * Get reason why a panel is locked
 * 
 * @param panelId Panel ID to check
 * @param state GameState
 * @returns Reason string if locked, null if unlocked
 */
export function getPanelUnlockReason(
	panelId: string,
	state: GameState
): string | null {
	// Map panel IDs to gate IDs
	const panelToGateMap: Record<string, string> = {
		[PANEL_IDS.ADVENTURERS]: 'ui_panel_adventurers',
		[PANEL_IDS.MISSIONS]: 'ui_panel_missions',
		[PANEL_IDS.FACILITIES]: 'ui_panel_facilities',
		[PANEL_IDS.EQUIPMENT]: 'ui_panel_equipment',
		[PANEL_IDS.CRAFTING]: 'ui_panel_crafting',
		[PANEL_IDS.DOCTRINE]: 'ui_panel_doctrine',
	};

	const gateId = panelToGateMap[panelId];
	if (gateId) {
		// Check functional status for missions panel
		if (panelId === PANEL_IDS.MISSIONS && isMissionsPanelUnlocked(state)) {
			if (!isMissionsPanelFunctional(state)) {
				return 'Recruit your first adventurer to activate';
			}
		}
		return getGateUnlockReason(gateId, state);
	}

	// Always available panels
	if (panelId === PANEL_IDS.DASHBOARD) {
		return null;
	}

	return 'Unknown panel';
}

