/**
 * Cost Queries Tests - Cost calculation queries for actions
 */

import { describe, it, expect } from 'vitest';
import {
	calculateFacilityUpgradeCost,
	getFacilityUpgradeCost,
	canAffordFacilityUpgrade,
	getGuildHallUpgradeCost,
	canUpgradeGuildHall
} from './CostQueries';
import { createTestGameState, createTestFacility } from '../../test-utils/testFactories';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import type { Entity } from '../primitives/Requirement';
// Import gating module to ensure gates are registered
import '../gating';

describe('CostQueries', () => {
	describe('calculateFacilityUpgradeCost', () => {
		it('should calculate cost as tier * 100', () => {
			expect(calculateFacilityUpgradeCost(1)).toBe(100);
			expect(calculateFacilityUpgradeCost(2)).toBe(200);
			expect(calculateFacilityUpgradeCost(5)).toBe(500);
		});

		it('should handle tier 0', () => {
			expect(calculateFacilityUpgradeCost(0)).toBe(0);
		});
	});

	describe('getFacilityUpgradeCost', () => {
		it('should return ResourceBundle with gold cost', () => {
			const cost = getFacilityUpgradeCost(3);
			expect(cost.get('gold')).toBe(300);
		});

		it('should return correct cost for different tiers', () => {
			const cost1 = getFacilityUpgradeCost(1);
			const cost2 = getFacilityUpgradeCost(2);
			expect(cost1.get('gold')).toBe(100);
			expect(cost2.get('gold')).toBe(200);
		});
	});

	describe('canAffordFacilityUpgrade', () => {
		it('should return true when player has enough gold', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 300)]);
			const state = createTestGameState({ resources });

			expect(canAffordFacilityUpgrade(state, 3)).toBe(true);
		});

		it('should return false when player lacks gold', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			const state = createTestGameState({ resources });

			expect(canAffordFacilityUpgrade(state, 3)).toBe(false);
		});

		it('should return true when player has exact amount', () => {
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 200)]);
			const state = createTestGameState({ resources });

			expect(canAffordFacilityUpgrade(state, 2)).toBe(true);
		});

		it('should return false when gold is 0', () => {
			const state = createTestGameState();
			expect(canAffordFacilityUpgrade(state, 1)).toBe(false);
		});
	});

	describe('getGuildHallUpgradeCost', () => {
		it('should calculate cost for next tier', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			const cost = getGuildHallUpgradeCost(state);
			// Current tier is 1, next tier is 2, cost = 2 * 100 = 200
			expect(cost.get('gold')).toBe(200);
		});

		it('should calculate cost for tier 0 to tier 1', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 0 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			const cost = getGuildHallUpgradeCost(state);
			// Current tier is 0, next tier is 1, cost = 1 * 100 = 100
			expect(cost.get('gold')).toBe(100);
		});

		it('should return cost for tier 1 when no guildhall exists', () => {
			const state = createTestGameState();
			const cost = getGuildHallUpgradeCost(state);
			// No guildhall means tier 0, next tier is 1, cost = 1 * 100 = 100
			expect(cost.get('gold')).toBe(100);
		});
	});

	describe('canUpgradeGuildHall', () => {
		it('should return false when tier not allowed by fame', () => {
			// Test tier 1 -> 2 upgrade, which requires 100 fame
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 1000),
				// No fame, so tier 2 gate is locked
			]);
			const state = createTestGameState({ entities, resources });

			// Tier 2 requires 100 fame, but we have 0, so should be false
			const canUpgrade = canUpgradeGuildHall(state);
			expect(canUpgrade).toBe(false);
		});

		it('should return false when player cannot afford', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const state = createTestGameState({ entities });

			// No gold, cannot afford tier 2 upgrade (200 gold)
			expect(canUpgradeGuildHall(state)).toBe(false);
		});

		it('should return true when both conditions met', () => {
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 1 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 200),
				new ResourceUnit('fame', 100) // Tier 2 requires 100 fame
			]);
			const state = createTestGameState({ entities, resources });

			// Tier 2 is allowed (tier 1 -> 2), we have 100 fame and 200 gold
			expect(canUpgradeGuildHall(state)).toBe(true);
		});

		it('should return false when fame gate blocks upgrade', () => {
			// Test tier 2 -> 3 upgrade, which requires 500 fame
			const guildhall = createTestFacility({ facilityType: 'Guildhall', tier: 2 });
			const entities = new Map<string, Entity>([[guildhall.id, guildhall]]);
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 1000),
				new ResourceUnit('fame', 100) // Only 100 fame, but tier 3 requires 500
			]);
			const state = createTestGameState({ entities, resources });

			// Tier 3 requires 500 fame, but we only have 100, so should be false
			expect(canUpgradeGuildHall(state)).toBe(false);
		});
	});
});

