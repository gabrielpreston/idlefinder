/**
 * Unlock Queries
 * 
 * Queries for checking unlock conditions, particularly fame-based unlocks.
 * Uses fame milestone thresholds from documentation.
 * 
 * Now uses centralized gating system while maintaining backward compatibility.
 */

import type { GameState } from '../entities/GameState';
import { isGateUnlocked, getGatesByType } from '../gating/GateQueries';

/**
 * Unlock Query Interface
 * 
 * Provides unlock status and information for UI gating.
 */
export interface UnlockQuery {
	/**
	 * Check if unlock condition is satisfied
	 * 
	 * @param state GameState
	 * @returns True if unlocked
	 */
	isUnlocked(state: GameState): boolean;

	/**
	 * Get reason why unlock is not available
	 * 
	 * @param state GameState
	 * @returns Reason string if locked, null if unlocked
	 */
	getUnlockReason(state: GameState): string | null;

	/**
	 * Get next threshold information
	 * 
	 * @param state GameState
	 * @returns Threshold info if locked, null if unlocked
	 */
	getNextThreshold(state: GameState): { threshold: number; current: number; remaining: number } | null;
}

/**
 * Create unlock condition from check function
 * 
 * @param check Function that returns true if unlocked
 * @param reason Function that returns reason if locked
 * @param getThreshold Function that returns threshold info if locked
 * @returns UnlockQuery
 */
export function createUnlockCondition(
	check: (state: GameState) => boolean,
	reason: (state: GameState) => string,
	getThreshold?: (state: GameState) => { threshold: number; current: number; remaining: number } | null
): UnlockQuery {
	return {
		isUnlocked: check,
		getUnlockReason: (state) => check(state) ? null : reason(state),
		getNextThreshold: getThreshold || (() => null)
	};
}

/**
 * Get current fame from GameState
 * 
 * @param state GameState
 * @returns Current fame value
 */
export function getCurrentFame(state: GameState): number {
	return state.resources.get('fame');
}

// Threshold arrays removed - now using centralized gate system
// See src/lib/domain/gating/gates/GameGates.ts for gate definitions

/**
 * Get unlocked mission tiers based on current fame
 * 
 * @param state GameState
 * @returns Array of unlocked mission tier numbers
 */
export function getUnlockedMissionTiers(state: GameState): number[] {
	const missionTierGates = getGatesByType('mission_tier', state);
	const unlocked: number[] = [];

	for (const { gate, status } of missionTierGates) {
		if (status.unlocked) {
			// Extract tier number from gate ID (e.g., 'mission_tier_2' -> 2)
			const tierMatch = gate.id.match(/mission_tier_(\d+)/);
			if (tierMatch) {
				const tier = parseInt(tierMatch[1], 10);
				unlocked.push(tier);
			}
		}
	}

	return unlocked.sort((a, b) => a - b);
}

/**
 * Get maximum facility tier allowed based on current fame
 * 
 * @param facilityType Optional facility type (currently all facilities use same thresholds)
 * @param state GameState
 * @returns Maximum tier allowed
 */
export function getMaxFacilityTier(
	_facilityType: string | undefined,
	state: GameState
): number {
	const facilityTierGates = getGatesByType('facility_tier', state);
	let maxTier = 1; // Tier 1 is always available

	for (const { gate, status } of facilityTierGates) {
		if (status.unlocked) {
			// Extract tier number from gate ID (e.g., 'facility_tier_2' -> 2)
			const tierMatch = gate.id.match(/facility_tier_(\d+)/);
			if (tierMatch) {
				const tier = parseInt(tierMatch[1], 10);
				maxTier = Math.max(maxTier, tier);
			}
		}
	}

	return maxTier;
}

/**
 * Check if a specific mission tier is unlocked
 * 
 * @param tier Mission tier to check
 * @param state GameState
 * @returns True if tier is unlocked
 */
export function isMissionTierUnlocked(
	tier: number,
	state: GameState
): boolean {
	return isGateUnlocked(`mission_tier_${tier}`, state);
}

/**
 * Check if a facility can be upgraded to a specific tier
 * 
 * @param targetTier Tier to upgrade to
 * @param state GameState
 * @returns True if tier is allowed by fame
 */
export function canUpgradeFacilityToTier(
	targetTier: number,
	state: GameState
): boolean {
	// Tier 1 is always available (no gate needed)
	if (targetTier <= 1) return true;

	// Check if the facility tier gate for targetTier is unlocked
	return isGateUnlocked(`facility_tier_${targetTier}`, state);
}

