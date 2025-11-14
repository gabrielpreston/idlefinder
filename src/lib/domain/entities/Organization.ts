import type { OrganizationId, PlayerId } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type { ResourceBundle } from '$lib/domain/valueObjects/ResourceBundle';
import { ProgressTrack } from './ProgressTrack';

/**
 * Core domain entity representing a player's organization.
 * Owns agents, tasks, facilities, and tracks progress.
 */
export class Organization {
	constructor(
		public readonly id: OrganizationId,
		public readonly ownerPlayerId: PlayerId,
		public readonly createdAt: Timestamp,
		public lastActiveAt: Timestamp,
		public readonly progressTracks: Map<string, ProgressTrack>,
		public readonly economyState: { wallet: ResourceBundle },
		public lastSimulatedAt: Timestamp
	) {
		if (!economyState || !economyState.wallet) {
			throw new Error('Organization economyState.wallet is required');
		}
		if (lastSimulatedAt.isBefore(createdAt)) {
			throw new Error('lastSimulatedAt cannot be before createdAt');
		}
	}

	/**
	 * Checks if the organization can afford the specified cost.
	 */
	canAfford(cost: ResourceBundle): boolean {
		return this.economyState.wallet.hasResources(cost);
	}

	/**
	 * Advances the organization's simulation time to the specified timestamp.
	 * Validates that the new time is not before the last simulated time.
	 */
	advanceTo(now: Timestamp): void {
		if (now.isBefore(this.lastSimulatedAt)) {
			throw new Error(
				`Cannot advance to time before lastSimulatedAt: ${now.value} < ${this.lastSimulatedAt.value}`
			);
		}
		this.lastSimulatedAt = now;
		this.lastActiveAt = now;
	}

	/**
	 * Retrieves a progress track by its key.
	 */
	getProgressTrack(key: string): ProgressTrack | undefined {
		return this.progressTracks.get(key);
	}
}

