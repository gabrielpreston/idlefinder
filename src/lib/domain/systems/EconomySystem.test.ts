import { describe, it, expect } from 'vitest';
import { EconomySystem } from './EconomySystem';
import { Organization } from '../entities/Organization';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle, ResourceUnit } from '../valueObjects';
import type { OrganizationId, PlayerId } from '../valueObjects/Identifier';

describe('EconomySystem', () => {
	const createOrganization = (walletAmount: number = 100): Organization => {
		const orgId: OrganizationId = Identifier.generate();
		const playerId: PlayerId = Identifier.generate();
		const createdAt = Timestamp.now();
		const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', walletAmount)]);
		return new Organization(
			orgId,
			playerId,
			createdAt,
			createdAt,
			new Map(),
			{ wallet },
			createdAt
		);
	};

	const system = new EconomySystem();

	describe('canAfford', () => {
		it('should return true when organization can afford cost', () => {
			const org = createOrganization(100);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			expect(system.canAfford(org, cost)).toBe(true);
		});

		it('should return false when organization cannot afford cost', () => {
			const org = createOrganization(50);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(system.canAfford(org, cost)).toBe(false);
		});
	});

	describe('applyCost', () => {
		it('should subtract cost from wallet', () => {
			const org = createOrganization(100);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 30)]);
			system.applyCost(org, cost);
			expect(org.economyState.wallet.get('gold')).toBe(70);
		});

		it('should throw error if organization cannot afford cost', () => {
			const org = createOrganization(50);
			const cost = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(() => system.applyCost(org, cost)).toThrow('Organization cannot afford the cost');
		});
	});

	describe('applyReward', () => {
		it('should add reward to wallet', () => {
			const org = createOrganization(100);
			const reward = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			system.applyReward(org, reward);
			expect(org.economyState.wallet.get('gold')).toBe(150);
		});

		it('should handle multiple resource types', () => {
			const org = createOrganization(100);
			const reward = ResourceBundle.fromArray([
				new ResourceUnit('gold', 25),
				new ResourceUnit('wood', 10)
			]);
			system.applyReward(org, reward);
			expect(org.economyState.wallet.get('gold')).toBe(125);
			expect(org.economyState.wallet.get('wood')).toBe(10);
		});
	});
});

