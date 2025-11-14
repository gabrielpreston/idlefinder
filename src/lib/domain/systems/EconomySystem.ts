import type { Organization } from '../entities/Organization';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';

/**
 * Domain system for managing organization economy.
 * Handles resource costs and rewards deterministically.
 */
export class EconomySystem {
	/**
	 * Checks if the organization can afford the specified cost.
	 */
	canAfford(org: Organization, cost: ResourceBundle): boolean {
		return org.canAfford(cost);
	}

	/**
	 * Applies a cost to the organization's wallet.
	 * Throws error if organization cannot afford the cost.
	 * Mutates the organization deterministically.
	 */
	applyCost(org: Organization, cost: ResourceBundle): void {
		if (!this.canAfford(org, cost)) {
			throw new Error('Organization cannot afford the cost');
		}
		const newWallet = org.economyState.wallet.subtract(cost);
		org.economyState.wallet = newWallet;
	}

	/**
	 * Applies a reward to the organization's wallet.
	 * Adds the reward resources to the wallet.
	 * Mutates the organization deterministically.
	 */
	applyReward(org: Organization, reward: ResourceBundle): void {
		const newWallet = org.economyState.wallet.add(reward);
		org.economyState.wallet = newWallet;
	}
}

