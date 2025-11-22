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
 * @param facilityType Facility type (e.g., 'Guildhall', 'Dormitory')
 * @param state GameState
 * @returns Maximum tier allowed
 */
export function getMaxFacilityTier(
	facilityType: string,
	state: GameState
): number {
	// Normalize facility type: Convert PascalCase to lowercase
	const normalizedFacilityType = facilityType.toLowerCase();
	
	const facilityTierGates = getGatesByType('facility_tier', state);
	let maxTier = 1; // Tier 1 is always available

	// Filter gates by metadata tags matching facility type
	for (const { gate, status } of facilityTierGates) {
		if (status.unlocked && gate.metadata?.tags?.includes(normalizedFacilityType)) {
			// Extract tier number from facility-specific gate IDs (e.g., 'guildhall_tier_2' -> 2)
			const tierMatch = gate.id.match(new RegExp(`${normalizedFacilityType}_tier_(\\d+)`));
			if (tierMatch) {
				const tier = parseInt(tierMatch[1], 10);
				maxTier = Math.max(maxTier, tier);
			}
		}
	}

	// Fallback to generic gates if no facility-specific gates found (temporary during transition)
	if (maxTier === 1) {
		for (const { gate, status } of facilityTierGates) {
			if (status.unlocked) {
				// Extract tier number from generic gate IDs (e.g., 'facility_tier_2' -> 2)
				const tierMatch = gate.id.match(/facility_tier_(\d+)/);
				if (tierMatch) {
					const tier = parseInt(tierMatch[1], 10);
					maxTier = Math.max(maxTier, tier);
				}
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
	return isGateUnlocked(`mission_tier_${String(tier)}`, state);
}

/**
 * Check if a facility can be upgraded to a specific tier
 * 
 * @param facilityType Facility type (e.g., 'Guildhall', 'Dormitory')
 * @param targetTier Tier to upgrade to
 * @param state GameState
 * @returns True if tier is allowed by fame
 */
export function canUpgradeFacilityToTier(
	facilityType: string,
	targetTier: number,
	state: GameState
): boolean {
	// Tier 1 is always available (no gate needed)
	if (targetTier <= 1) return true;

	// Normalize facility type: Convert PascalCase to lowercase
	const normalizedFacilityType = facilityType.toLowerCase();
	
	// Check facility-specific gate first (e.g., 'guildhall_tier_2')
	const facilitySpecificGateId = `${normalizedFacilityType}_tier_${String(targetTier)}`;
	if (isGateUnlocked(facilitySpecificGateId, state)) {
		return true;
	}

	// Fallback to generic gate if facility-specific not found (temporary during transition)
	return isGateUnlocked(`facility_tier_${String(targetTier)}`, state);
}

/**
 * Map recipe ID (kebab-case) to gate ID (snake_case)
 * 
 * @param recipeId Recipe ID (e.g., 'common-weapon')
 * @returns Gate ID (e.g., 'crafting_recipe_common_weapon')
 */
function getCraftingRecipeGateId(recipeId: string): string {
	// Map 'common-weapon' -> 'crafting_recipe_common_weapon'
	return `crafting_recipe_${recipeId.replace(/-/g, '_')}`;
}

/**
 * Check if a caravan type is unlocked
 * 
 * @param caravanType Caravan type (e.g., 'basic', 'trade', 'recruit')
 * @param state GameState
 * @returns True if caravan type is unlocked
 */
export function isCaravanTypeUnlocked(
	caravanType: string,
	state: GameState
): boolean {
	const gateId = `caravan_type_${caravanType.toLowerCase()}`;
	return isGateUnlocked(gateId, state);
}

/**
 * Get all unlocked caravan types
 * 
 * @param state GameState
 * @returns Array of unlocked caravan type names
 */
export function getUnlockedCaravanTypes(state: GameState): string[] {
	const caravanGates = getGatesByType('caravan_type', state);
	const unlocked: string[] = [];

	for (const { gate, status } of caravanGates) {
		if (status.unlocked) {
			// Extract caravan type from gate ID (e.g., 'caravan_type_basic' -> 'basic')
			const typeMatch = gate.id.match(/caravan_type_(.+)/);
			if (typeMatch) {
				unlocked.push(typeMatch[1]);
			}
		}
	}

	return unlocked;
}

/**
 * Check if a crafting recipe is unlocked
 * 
 * @param recipeId Recipe ID (e.g., 'common-weapon', 'uncommon-armor')
 * @param state GameState
 * @returns True if recipe is unlocked
 */
export function isCraftingRecipeUnlocked(
	recipeId: string,
	state: GameState
): boolean {
	const gateId = getCraftingRecipeGateId(recipeId);
	return isGateUnlocked(gateId, state);
}

/**
 * Get all unlocked crafting recipe IDs
 * 
 * @param state GameState
 * @returns Array of unlocked recipe IDs (kebab-case, not gate IDs)
 */
export function getUnlockedCraftingRecipes(state: GameState): string[] {
	const recipeGates = getGatesByType('crafting_recipe', state);
	const unlocked: string[] = [];

	for (const { gate, status } of recipeGates) {
		if (status.unlocked) {
			// Extract recipe ID from gate ID (e.g., 'crafting_recipe_common_weapon' -> 'common-weapon')
			const recipeMatch = gate.id.match(/crafting_recipe_(.+)/);
			if (recipeMatch) {
				// Convert snake_case back to kebab-case
				const recipeId = recipeMatch[1].replace(/_/g, '-');
				unlocked.push(recipeId);
			}
		}
	}

	return unlocked;
}

/**
 * Check if a facility can be built
 * 
 * @param facilityType Facility type (e.g., 'Dormitory', 'MissionCommand')
 * @param state GameState
 * @returns True if facility construction is unlocked
 */
export function canBuildFacility(
	facilityType: string,
	state: GameState
): boolean {
	// Normalize facility type: Convert PascalCase to lowercase
	const normalizedFacilityType = facilityType.toLowerCase();
	const gateId = `facility_build_${normalizedFacilityType}`;
	return isGateUnlocked(gateId, state);
}

