/**
 * FacilitySystem Tests - Fast unit tests
 * Speed target: <200ms total
 */

import { describe, it, expect } from 'vitest';
import { FacilitySystem } from './FacilitySystem';
import { createTestPlayerState } from '../../test-utils';

describe('FacilitySystem', () => {
	const system = new FacilitySystem();

	describe('upgrade', () => {
		it('should upgrade facility level', () => {
			const state = createTestPlayerState();
			const initialLevel = state.facilities.tavern.level;

			const newState = system.upgrade(state, 'tavern');

			expect(newState.facilities.tavern.level).toBe(initialLevel + 1);
		});

		it('should generate effects for upgraded facility', () => {
			const state = createTestPlayerState();

			const newState = system.upgrade(state, 'tavern');

			expect(newState.facilities.tavern.effects.length).toBeGreaterThan(0);
			expect(newState.facilities.tavern.effects[0]).toContain('Level 2');
		});

		it('should not modify other facilities', () => {
			const state = createTestPlayerState();
			const initialGuildHallLevel = state.facilities.guildHall.level;
			const initialBlacksmithLevel = state.facilities.blacksmith.level;

			const newState = system.upgrade(state, 'tavern');

			expect(newState.facilities.guildHall.level).toBe(initialGuildHallLevel);
			expect(newState.facilities.blacksmith.level).toBe(initialBlacksmithLevel);
		});

		it('should upgrade guildHall correctly', () => {
			const state = createTestPlayerState();

			const newState = system.upgrade(state, 'guildHall');

			expect(newState.facilities.guildHall.level).toBe(2);
			expect(newState.facilities.guildHall.effects[0]).toContain('guild hall');
		});

		it('should upgrade blacksmith correctly', () => {
			const state = createTestPlayerState();

			const newState = system.upgrade(state, 'blacksmith');

			expect(newState.facilities.blacksmith.level).toBe(2);
			expect(newState.facilities.blacksmith.effects[0]).toContain('blacksmith');
		});
	});

	describe('canUpgrade', () => {
		it('should return true when facility level is below max', () => {
			const state = createTestPlayerState();
			expect(state.facilities.tavern.level).toBeLessThan(10);

			expect(system.canUpgrade(state, 'tavern')).toBe(true);
		});

		it('should return false when facility is at max level', () => {
			const state = createTestPlayerState();
			// Set facility to max level
			state.facilities.tavern.level = 10;

			expect(system.canUpgrade(state, 'tavern')).toBe(false);
		});
	});

	describe('getUpgradeCost', () => {
		it('should calculate cost based on current level', () => {
			const cost = system.getUpgradeCost('tavern', 1);

			expect(cost.gold).toBe(100); // 1 * 100
			expect(cost.supplies).toBe(10); // 1 * 10
			expect(cost.relics).toBe(0);
		});

		it('should increase cost for higher levels', () => {
			const costLevel1 = system.getUpgradeCost('tavern', 1);
			const costLevel5 = system.getUpgradeCost('tavern', 5);

			expect(costLevel5.gold).toBeGreaterThan(costLevel1.gold);
			expect(costLevel5.supplies).toBeGreaterThan(costLevel1.supplies);
		});

		it('should return same cost structure for all facilities', () => {
			const tavernCost = system.getUpgradeCost('tavern', 2);
			const guildHallCost = system.getUpgradeCost('guildHall', 2);
			const blacksmithCost = system.getUpgradeCost('blacksmith', 2);

			expect(tavernCost.gold).toBe(guildHallCost.gold);
			expect(guildHallCost.gold).toBe(blacksmithCost.gold);
		});
	});
});

