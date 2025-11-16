import { describe, it, expect } from 'vitest';
import { EconomySystem } from './EconomySystem';
import { Organization } from '../entities/Organization';
import { createTestOrganization, createTestGold, createTestResourceBundle } from '../../test-utils';

describe('EconomySystem', () => {
	const createOrganization = (walletAmount: number = 100): Organization => {
		return createTestOrganization({
			economyState: { wallet: createTestGold(walletAmount) }
		});
	};

	const system = new EconomySystem();

	describe('canAfford', () => {
		it('should return true when organization can afford cost', () => {
			const org = createOrganization(100);
			const cost = createTestGold(50);
			expect(system.canAfford(org, cost)).toBe(true);
		});

		it('should return false when organization cannot afford cost', () => {
			const org = createOrganization(50);
			const cost = createTestGold(100);
			expect(system.canAfford(org, cost)).toBe(false);
		});
	});

	describe('applyCost', () => {
		it('should subtract cost from wallet', () => {
			const org = createOrganization(100);
			const cost = createTestGold(30);
			system.applyCost(org, cost);
			expect(org.economyState.wallet.get('gold')).toBe(70);
		});

		it('should throw error if organization cannot afford cost', () => {
			const org = createOrganization(50);
			const cost = createTestGold(100);
			expect(() => system.applyCost(org, cost)).toThrow('Organization cannot afford the cost');
		});
	});

	describe('applyReward', () => {
		it('should add reward to wallet', () => {
			const org = createOrganization(100);
			const reward = createTestGold(50);
			system.applyReward(org, reward);
			expect(org.economyState.wallet.get('gold')).toBe(150);
		});

		it('should handle multiple resource types', () => {
			const org = createOrganization(100);
			const reward = createTestResourceBundle({ gold: 25, wood: 10 });
			system.applyReward(org, reward);
			expect(org.economyState.wallet.get('gold')).toBe(125);
			expect(org.economyState.wallet.get('wood')).toBe(10);
		});
	});
});

