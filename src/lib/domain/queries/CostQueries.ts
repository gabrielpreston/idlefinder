/**
 * Cost Queries
 * 
 * Reusable cost calculation queries for actions.
 * Extracts cost calculation logic from actions for UI pre-validation.
 */

import type { GameState } from '../entities/GameState';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { getGuildHallTier } from './FacilityQueries';
import { canUpgradeFacilityToTier } from './UnlockQueries';
import { GameConfig } from '../config/GameConfig';

/**
 * Cost Calculator Interface
 * 
 * Provides cost calculation and affordability checks for actions.
 */
export interface CostCalculator {
	/**
	 * Get cost for action with given parameters
	 * 
	 * @param state GameState
	 * @param params Action-specific parameters
	 * @returns ResourceBundle representing the cost
	 */
	getCost(state: GameState, params: Record<string, unknown>): ResourceBundle;

	/**
	 * Check if player can afford the cost
	 * 
	 * @param state GameState
	 * @param params Action-specific parameters
	 * @returns True if player has sufficient resources
	 */
	canAfford(state: GameState, params: Record<string, unknown>): boolean;
}

/**
 * Calculate facility upgrade cost
 * 
 * Simple progression: tier * 100
 * Matches UpgradeFacilityAction.costFor() pattern.
 * 
 * @param tier Target tier (current tier + 1)
 * @returns Cost in gold
 */
export function calculateFacilityUpgradeCost(tier: number): number {
	return GameConfig.costs.facilityUpgrade(tier);
}

/**
 * Get facility upgrade cost as ResourceBundle
 * 
 * @param tier Target tier (current tier + 1)
 * @returns ResourceBundle with gold cost
 */
export function getFacilityUpgradeCost(tier: number): ResourceBundle {
	const cost = calculateFacilityUpgradeCost(tier);
	return ResourceBundle.fromArray([new ResourceUnit('gold', cost)]);
}

/**
 * Check if player can afford facility upgrade
 * 
 * @param state GameState
 * @param tier Target tier (current tier + 1)
 * @returns True if player has enough gold
 */
export function canAffordFacilityUpgrade(state: GameState, tier: number): boolean {
	const cost = calculateFacilityUpgradeCost(tier);
	const currentGold = state.resources.get('gold');
	return currentGold >= cost;
}

/**
 * Get guildhall upgrade cost
 * 
 * Guildhall-specific convenience function that gets current tier and calculates upgrade cost.
 * 
 * @param state GameState
 * @returns ResourceBundle with gold cost for upgrading guildhall to next tier
 */
export function getGuildHallUpgradeCost(state: GameState): ResourceBundle {
	const currentTier = getGuildHallTier(state);
	const targetTier = currentTier + 1;
	return getFacilityUpgradeCost(targetTier);
}

/**
 * Check if guildhall can be upgraded
 * 
 * Guildhall-specific convenience function that checks:
 * 1. Current tier is below max allowed tier (fame-based)
 * 2. Player can afford the upgrade cost
 * 
 * @param state GameState
 * @returns True if guildhall can be upgraded
 */
export function canUpgradeGuildHall(state: GameState): boolean {
	const currentTier = getGuildHallTier(state);
	const targetTier = currentTier + 1;
	
	// Check if tier is allowed by fame
	if (!canUpgradeFacilityToTier('Guildhall', targetTier, state)) {
		return false;
	}
	
	// Check if player can afford
	return canAffordFacilityUpgrade(state, targetTier);
}

/**
 * Get adventurer recruitment cost
 * 
 * @returns ResourceBundle with gold cost for recruiting an adventurer
 */
export function getRecruitAdventurerCost(): ResourceBundle {
	return ResourceBundle.fromArray([new ResourceUnit('gold', GameConfig.costs.recruitAdventurer)]);
}

/**
 * Check if player can afford to recruit an adventurer
 * 
 * @param state GameState
 * @returns True if player has enough gold
 */
export function canAffordRecruitAdventurer(state: GameState): boolean {
	const cost = GameConfig.costs.recruitAdventurer;
	const currentGold = state.resources.get('gold') || 0;
	return currentGold >= cost;
}

/**
 * Get recruit pool refresh cost
 * 
 * @returns ResourceBundle with gold cost for refreshing the recruit pool
 */
export function getRefreshRecruitPoolCost(): ResourceBundle {
	return ResourceBundle.fromArray([new ResourceUnit('gold', GameConfig.costs.refreshRecruitPool)]);
}

/**
 * Check if player can afford to refresh the recruit pool
 * 
 * @param state GameState
 * @returns True if player has enough gold
 */
export function canAffordRefreshRecruitPool(state: GameState): boolean {
	const cost = GameConfig.costs.refreshRecruitPool;
	const currentGold = state.resources.get('gold') || 0;
	return currentGold >= cost;
}

/**
 * Calculate facility construction cost
 * 
 * @param facilityType Facility type to construct
 * @returns Cost in gold
 */
export function calculateFacilityConstructionCost(facilityType: string): number {
	return GameConfig.costs.facilityConstruction(facilityType);
}

/**
 * Get facility construction cost as ResourceBundle
 * 
 * @param facilityType Facility type to construct
 * @returns ResourceBundle with gold cost
 */
export function getFacilityConstructionCost(facilityType: string): ResourceBundle {
	const cost = calculateFacilityConstructionCost(facilityType);
	return ResourceBundle.fromArray([new ResourceUnit('gold', cost)]);
}

/**
 * Check if player can afford facility construction
 * 
 * @param state GameState
 * @param facilityType Facility type to construct
 * @returns True if player has enough gold
 */
export function canAffordFacilityConstruction(state: GameState, facilityType: string): boolean {
	const cost = calculateFacilityConstructionCost(facilityType);
	const currentGold = state.resources.get('gold') || 0;
	return currentGold >= cost;
}

