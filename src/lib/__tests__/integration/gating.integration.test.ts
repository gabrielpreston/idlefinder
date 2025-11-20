/**
 * Gating Integration Tests
 * 
 * Integration tests for gate evaluation with real GameState,
 * migration validation, and store integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGameState, setupMockLocalStorage } from '../../test-utils';
import type { GameState } from '../../domain/entities/GameState';
import { ResourceBundle } from '../../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../../domain/valueObjects/ResourceUnit';
// Import gating module to ensure gates are registered
import '../../domain/gating';
import { isGateUnlocked, getGateStatus, getGatesByType } from '../../domain/gating/GateQueries';
import { gateRegistry } from '../../domain/gating/GateRegistry';
import {
	isAdventurersPanelUnlocked,
	isMissionsPanelUnlocked,
	isFacilitiesPanelUnlocked,
	getPanelUnlockReason,
} from '../../domain/queries/UIGatingQueries';
import {
	getUnlockedMissionTiers,
	getMaxFacilityTier,
	isMissionTierUnlocked,
	canUpgradeFacilityToTier,
} from '../../domain/queries/UnlockQueries';
import { Facility } from '../../domain/entities/Facility';

describe('Gating Integration', () => {
	let state: GameState;

	beforeEach(() => {
		setupMockLocalStorage();
		state = createTestGameState();
	});

	describe('gate evaluation with real GameState', () => {
		describe('UI panel gates', () => {
			it('should unlock adventurers panel when Guild Hall reaches Tier 1', () => {
				// Initial state has Guild Hall at Tier 0
				expect(isGateUnlocked('ui_panel_adventurers', state)).toBe(false);

				// Upgrade Guild Hall to Tier 1
				const guildhall = Array.from(state.entities.values()).find(
					(e) =>
						e.type === 'Facility' &&
						(e as Facility).attributes.facilityType === 'Guildhall'
				) as Facility;
				expect(guildhall).toBeDefined();
				guildhall.upgrade(); // Increments from 0 to 1

				expect(isGateUnlocked('ui_panel_adventurers', state)).toBe(true);
			});

			it('should unlock missions panel when Guild Hall reaches Tier 1', () => {
				// Initial state has Guild Hall at Tier 0
				expect(isGateUnlocked('ui_panel_missions', state)).toBe(false);

				// Upgrade Guild Hall to Tier 1
				const guildhall = Array.from(state.entities.values()).find(
					(e) =>
						e.type === 'Facility' &&
						(e as Facility).attributes.facilityType === 'Guildhall'
				) as Facility;
				guildhall.upgrade(); // Increments from 0 to 1

				expect(isGateUnlocked('ui_panel_missions', state)).toBe(true);
			});

			it('should unlock facilities panel when Guild Hall reaches Tier 0', () => {
				// Initial state has Guild Hall at Tier 0
				expect(isGateUnlocked('ui_panel_facilities', state)).toBe(true);
			});
		});

		describe('mission tier gates', () => {
			it('should unlock mission tiers at correct fame thresholds', () => {
				// Tier 1 unlocked at 0 fame
				expect(isGateUnlocked('mission_tier_1', state)).toBe(true);

				// Tier 2 requires 100 fame
				expect(isGateUnlocked('mission_tier_2', state)).toBe(false);

				const resources = ResourceBundle.fromArray([
					new ResourceUnit('fame', 100),
				]);
				const stateWithFame = createTestGameState({ resources });

				expect(isGateUnlocked('mission_tier_2', stateWithFame)).toBe(true);
				expect(isGateUnlocked('mission_tier_3', stateWithFame)).toBe(false);
			});

			it('should unlock multiple tiers simultaneously', () => {
				const resources = ResourceBundle.fromArray([
					new ResourceUnit('fame', 500),
				]);
				const stateWithFame = createTestGameState({ resources });

				expect(isGateUnlocked('mission_tier_1', stateWithFame)).toBe(true);
				expect(isGateUnlocked('mission_tier_2', stateWithFame)).toBe(true);
				expect(isGateUnlocked('mission_tier_3', stateWithFame)).toBe(true);
				expect(isGateUnlocked('mission_tier_4', stateWithFame)).toBe(false);
			});
		});

		describe('facility tier gates', () => {
			it('should unlock facility tiers at correct fame thresholds', () => {
				// Tier 2 requires 100 fame
				expect(isGateUnlocked('guildhall_tier_2', state)).toBe(false);

				const resources = ResourceBundle.fromArray([
					new ResourceUnit('fame', 100),
				]);
				const stateWithFame = createTestGameState({ resources });

				expect(isGateUnlocked('guildhall_tier_2', stateWithFame)).toBe(true);
				expect(isGateUnlocked('guildhall_tier_3', stateWithFame)).toBe(false);
			});

			it('should respect fame limits for tier upgrades', () => {
				const resources = ResourceBundle.fromArray([
					new ResourceUnit('fame', 100),
				]);
				const stateWithFame = createTestGameState({ resources });

				// Can upgrade to tier 2
				expect(canUpgradeFacilityToTier('Guildhall', 2, stateWithFame)).toBe(true);
				// Cannot upgrade to tier 3
				expect(canUpgradeFacilityToTier('Guildhall', 3, stateWithFame)).toBe(false);
			});
		});
	});

	describe('migration validation', () => {
		it('should maintain backward compatibility for UI panel queries', () => {
			// Initial state - Facilities unlocked at Tier 0, others locked
			expect(isAdventurersPanelUnlocked(state)).toBe(false);
			expect(isMissionsPanelUnlocked(state)).toBe(false);
			expect(isFacilitiesPanelUnlocked(state)).toBe(true); // Unlocked at Tier 0

			// Upgrade Guild Hall to Tier 1
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade(); // Increments from 0 to 1

			expect(isAdventurersPanelUnlocked(state)).toBe(true);
			expect(isMissionsPanelUnlocked(state)).toBe(true);
			// Facilities panel unlocked at Tier 0
			expect(isFacilitiesPanelUnlocked(state)).toBe(true);
		});

		it('should return correct unlock reasons', () => {
			const reason = getPanelUnlockReason('adventurers', state);
			expect(reason).toBeDefined();
			expect(reason).toContain('tier 1'); // Gate reason mentions tier requirement

			// Upgrade Guild Hall
			const guildhall = Array.from(state.entities.values()).find(
				(e) =>
					e.type === 'Facility' &&
					(e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			guildhall.upgrade(); // Increments from 0 to 1

			const reasonAfter = getPanelUnlockReason('adventurers', state);
			expect(reasonAfter).toBeNull();
		});

		it('should return correct unlocked mission tiers', () => {
			// Initial state has 0 fame - only tier 1 unlocked
			const unlocked = getUnlockedMissionTiers(state);
			expect(unlocked).toEqual([1]);

			// Add 100 fame - tiers 1 and 2 unlocked
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 100),
			]);
			const stateWithFame = createTestGameState({ resources });
			const unlockedWithFame = getUnlockedMissionTiers(stateWithFame);
			expect(unlockedWithFame).toEqual([1, 2]);
		});

		it('should return correct max facility tier', () => {
			// Initial state has 0 fame - max tier 1
			expect(getMaxFacilityTier('Guildhall', state)).toBe(1);

			// Add 500 fame - max tier 3
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 500),
			]);
			const stateWithFame = createTestGameState({ resources });
			expect(getMaxFacilityTier('Guildhall', stateWithFame)).toBe(3);
		});

		it('should check mission tier unlock status correctly', () => {
			expect(isMissionTierUnlocked(1, state)).toBe(true);
			expect(isMissionTierUnlocked(2, state)).toBe(false);

			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 100),
			]);
			const stateWithFame = createTestGameState({ resources });
			expect(isMissionTierUnlocked(2, stateWithFame)).toBe(true);
		});

		it('should check facility tier upgrade correctly', () => {
			// Tier 1 always available
			expect(canUpgradeFacilityToTier('Guildhall', 1, state)).toBe(true);

			// Tier 2 requires fame
			expect(canUpgradeFacilityToTier('Guildhall', 2, state)).toBe(false);

			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 100),
			]);
			const stateWithFame = createTestGameState({ resources });
			expect(canUpgradeFacilityToTier('Guildhall', 2, stateWithFame)).toBe(true);
			expect(canUpgradeFacilityToTier('Guildhall', 3, stateWithFame)).toBe(false);
		});
	});

	describe('gate status and progress', () => {
		it('should return gate status with progress information', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('fame', 75),
			]);
			const stateWithFame = createTestGameState({ resources });

			const status = getGateStatus('mission_tier_2', stateWithFame);
			expect(status).toBeDefined();
			expect(status?.unlocked).toBe(false);
			expect(status?.progress).toBe(0.75);
			expect(status?.nextThreshold).toBeDefined();
			expect(status?.nextThreshold?.threshold).toBe(100);
			expect(status?.nextThreshold?.current).toBe(75);
			expect(status?.nextThreshold?.remaining).toBe(25);
		});

		it('should return gates by type', () => {
			const uiPanelGates = getGatesByType('ui_panel', state);
			expect(uiPanelGates.length).toBeGreaterThan(0);
			expect(uiPanelGates.every((g) => g.gate.type === 'ui_panel')).toBe(
				true
			);

			const missionTierGates = getGatesByType('mission_tier', state);
			expect(missionTierGates.length).toBe(5); // Tiers 1-5
		});
	});

	describe('gate registry integration', () => {
		it('should have all MVP gates registered', () => {
			const allGates = gateRegistry.getAll();
			expect(allGates.length).toBeGreaterThanOrEqual(12);

			// Check for expected gate types
			const uiPanels = gateRegistry.getByType('ui_panel');
			expect(uiPanels.length).toBe(6); // adventurers, missions, facilities, equipment, crafting, doctrine

			const missionTiers = gateRegistry.getByType('mission_tier');
			expect(missionTiers.length).toBe(5);

			const facilityTiers = gateRegistry.getByType('facility_tier');
			expect(facilityTiers.length).toBe(25); // 5 facilities × 5 tiers
		});
	});
});

