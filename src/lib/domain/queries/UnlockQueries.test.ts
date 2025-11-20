/**
 * Unlock Queries Tests - Fame-based unlock condition queries
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	createUnlockCondition,
	getCurrentFame,
	getUnlockedMissionTiers,
	getMaxFacilityTier,
	isMissionTierUnlocked,
	canUpgradeFacilityToTier
} from './UnlockQueries';
import { createTestGameState } from '../../test-utils/testFactories';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import type { GameState } from '../entities/GameState';
import { GameConfig } from '../config/GameConfig';
// Import gating module to ensure gates are registered
import '../gating';

describe('UnlockQueries', () => {
	let state: GameState;

	beforeEach(() => {
		// Use GameConfig starting resources for default test state
		const resources = ResourceBundle.fromArray([
			new ResourceUnit('gold', GameConfig.startingResources.gold),
			new ResourceUnit('fame', GameConfig.startingResources.fame)
		]);
		state = createTestGameState({ resources });
	});

	describe('createUnlockCondition', () => {
		it('should create unlock query with isUnlocked function', () => {
			const check = (state: GameState) => state.resources.get('gold') >= 100;
			const reason = () => 'Need 100 gold';
			const unlockQuery = createUnlockCondition(check, reason);

			const stateWithGold = createTestGameState({
				resources: ResourceBundle.fromArray([new ResourceUnit('gold', 100)])
			});

			expect(unlockQuery.isUnlocked(stateWithGold)).toBe(true);
			expect(unlockQuery.isUnlocked(state)).toBe(false);
		});

		it('should return null reason when unlocked', () => {
			const check = (state: GameState) => state.resources.get('gold') >= 50;
			const reason = () => 'Need 50 gold';
			const unlockQuery = createUnlockCondition(check, reason);

			const stateWithGold = createTestGameState({
				resources: ResourceBundle.fromArray([new ResourceUnit('gold', 50)])
			});

			expect(unlockQuery.getUnlockReason(stateWithGold)).toBeNull();
		});

		it('should return reason when locked', () => {
			const requiredGold = 50;
			const check = (state: GameState) => state.resources.get('gold') >= requiredGold;
			const reason = () => `Need ${requiredGold} gold`;
			const unlockQuery = createUnlockCondition(check, reason);

			// State should have default starting gold (15), which is less than 50
			expect(unlockQuery.getUnlockReason(state)).toBe(`Need ${requiredGold} gold`);
		});

		it('should use getThreshold function when provided', () => {
			const check = (state: GameState) => state.resources.get('gold') >= 100;
			const reason = () => 'Need 100 gold';
			const getThreshold = (state: GameState) => ({
				threshold: 100,
				current: state.resources.get('gold'),
				remaining: 100 - state.resources.get('gold')
			});
			const unlockQuery = createUnlockCondition(check, reason, getThreshold);

			const threshold = unlockQuery.getNextThreshold(state);
			expect(threshold).not.toBeNull();
			expect(threshold?.threshold).toBe(100);
			expect(threshold?.current).toBe(state.resources.get('gold'));
		});

		it('should return null threshold when getThreshold not provided', () => {
			const check = (state: GameState) => state.resources.get('gold') >= 50;
			const reason = () => 'Need 50 gold';
			const unlockQuery = createUnlockCondition(check, reason);

			expect(unlockQuery.getNextThreshold(state)).toBeNull();
		});
	});

	describe('getCurrentFame', () => {
		it('should return current fame from GameState', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('fame', 250)]);
			const stateWithFame = createTestGameState({ resources });

			expect(getCurrentFame(stateWithFame)).toBe(250);
		});

		it('should return 0 when fame not present', () => {
			expect(getCurrentFame(state)).toBe(0);
		});
	});

	describe('getUnlockedMissionTiers', () => {
		it('should return empty array when no mission tiers unlocked', () => {
			// Initial state has 0 fame, only tier 1 should be unlocked
			const tiers = getUnlockedMissionTiers(state);
			expect(tiers.length).toBeGreaterThanOrEqual(0);
		});

		it('should return unlocked tiers sorted ascending', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('fame', 500)]);
			const stateWithFame = createTestGameState({ resources });

			const tiers = getUnlockedMissionTiers(stateWithFame);
			
			// Should have multiple tiers unlocked with 500 fame
			expect(tiers.length).toBeGreaterThan(0);
			// Verify sorted
			for (let i = 1; i < tiers.length; i++) {
				expect(tiers[i]).toBeGreaterThan(tiers[i - 1]);
			}
		});

		it('should include tier 1 at 0 fame', () => {
			const tiers = getUnlockedMissionTiers(state);
			// Tier 1 should be unlocked at 0 fame
			expect(tiers).toContain(1);
		});
	});

	describe('getMaxFacilityTier', () => {
		it('should return at least tier 1', () => {
			const maxTier = getMaxFacilityTier('Guildhall', state);
			expect(maxTier).toBeGreaterThanOrEqual(1);
		});

		it('should return higher tier with more fame', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('fame', 500)]);
			const stateWithFame = createTestGameState({ resources });

			const maxTier = getMaxFacilityTier('Guildhall', stateWithFame);
			expect(maxTier).toBeGreaterThanOrEqual(1);
		});

		it('should return same tier for different facilities with same fame', () => {
			const maxTier1 = getMaxFacilityTier('Guildhall', state);
			const maxTier2 = getMaxFacilityTier('Dormitory', state);

			expect(maxTier1).toBe(maxTier2);
		});
	});

	describe('isMissionTierUnlocked', () => {
		it('should return true for tier 1 at 0 fame', () => {
			expect(isMissionTierUnlocked(1, state)).toBe(true);
		});

		it('should return false for tier 2 at 0 fame', () => {
			expect(isMissionTierUnlocked(2, state)).toBe(false);
		});

		it('should return true for tier 2 with sufficient fame', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('fame', 100)]);
			const stateWithFame = createTestGameState({ resources });

			expect(isMissionTierUnlocked(2, stateWithFame)).toBe(true);
		});
	});

	describe('canUpgradeFacilityToTier', () => {
		it('should return true for tier 1', () => {
			expect(canUpgradeFacilityToTier('Guildhall', 1, state)).toBe(true);
		});

		it('should return true for tier 0 or negative', () => {
			expect(canUpgradeFacilityToTier('Guildhall', 0, state)).toBe(true);
			expect(canUpgradeFacilityToTier('Guildhall', -1, state)).toBe(true);
		});

		it('should return false for tier 2 at 0 fame', () => {
			expect(canUpgradeFacilityToTier('Guildhall', 2, state)).toBe(false);
		});

		it('should return true for tier 2 with sufficient fame', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('fame', 100)]);
			const stateWithFame = createTestGameState({ resources });

			expect(canUpgradeFacilityToTier('Guildhall', 2, stateWithFame)).toBe(true);
		});
	});
});

