/**
 * Economy System Tests - Organization economy management
 */

import { describe, it, expect } from 'vitest';
import { EconomySystem } from './EconomySystem';
import { Organization } from '../entities/Organization';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';

function createTestOrganization(initialGold: number = 100): Organization {
	const orgId = Identifier.generate<'OrganizationId'>();
	const playerId = Identifier.generate<'PlayerId'>();
	const now = Timestamp.now();
	const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', initialGold)]);
	return new Organization(
		orgId,
		playerId,
		now,
		now,
		new Map(),
		{ wallet },
		now
	);
}

describe('EconomySystem', () => {
	describe('canAfford', () => {
		it('should return true when organization has enough resources', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);

			expect(system.canAfford(org, cost)).toBe(true);
		});

		it('should return false when organization lacks resources', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(50);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);

			expect(system.canAfford(org, cost)).toBe(false);
		});

		it('should return true when organization has exact amount', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);

			expect(system.canAfford(org, cost)).toBe(true);
		});
	});

	describe('applyCost', () => {
		it('should subtract cost from wallet', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 30)]);
			const initialGold = org.economyState.wallet.get('gold');

			system.applyCost(org, cost);

			expect(org.economyState.wallet.get('gold')).toBe(initialGold - 30);
		});

		it('should throw error when organization cannot afford', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(50);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);

			expect(() => system.applyCost(org, cost)).toThrow('Organization cannot afford the cost');
		});

		it('should handle multiple resource types', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			org.economyState.wallet = org.economyState.wallet.add(
				ResourceBundle.fromArray([new ResourceUnit('materials', 50)])
			);
			const cost = ResourceBundle.fromArray([
				new ResourceUnit('gold', 30),
				new ResourceUnit('materials', 20)
			]);

			system.applyCost(org, cost);

			expect(org.economyState.wallet.get('gold')).toBe(70);
			expect(org.economyState.wallet.get('materials')).toBe(30);
		});
	});

	describe('applyReward', () => {
		it('should add reward to wallet', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			const reward = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			const initialGold = org.economyState.wallet.get('gold');

			system.applyReward(org, reward);

			expect(org.economyState.wallet.get('gold')).toBe(initialGold + 50);
		});

		it('should handle multiple resource types', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			const reward = ResourceBundle.fromArray([
				new ResourceUnit('gold', 50),
				new ResourceUnit('fame', 10)
			]);

			system.applyReward(org, reward);

			expect(org.economyState.wallet.get('gold')).toBe(150);
			expect(org.economyState.wallet.get('fame')).toBe(10);
		});

		it('should accumulate resources correctly', () => {
			const system = new EconomySystem();
			const org = createTestOrganization(100);
			const reward1 = ResourceBundle.fromArray([new ResourceUnit('gold', 25)]);
			const reward2 = ResourceBundle.fromArray([new ResourceUnit('gold', 25)]);

			system.applyReward(org, reward1);
			system.applyReward(org, reward2);

			expect(org.economyState.wallet.get('gold')).toBe(150);
		});
	});
});

