/**
 * Game State Store - reactive Svelte store for game state
 * Replaces organizationStore - provides reactive access to PlayerState
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { PlayerState } from '../domain/entities/PlayerState';
import { getBusManager } from '../bus/BusManager';

/**
 * Game state store - reactive wrapper around BusManager state
 */
function createGameStateStore() {
	const { subscribe, set } = writable<PlayerState | null>(null);

	// Subscribe to domain events to update store
	// Note: This will be set up after BusManager is initialized
	let unsubscribeFunctions: (() => void)[] = [];

	function setupSubscriptions() {
		try {
			const busManager = getBusManager();
			unsubscribeFunctions = [
				busManager.domainEventBus.subscribe('ResourcesChanged', () => {
					set(busManager.getState());
				}),
				busManager.domainEventBus.subscribe('MissionStarted', () => {
					set(busManager.getState());
				}),
				busManager.domainEventBus.subscribe('MissionCompleted', () => {
					set(busManager.getState());
				}),
				busManager.domainEventBus.subscribe('AdventurerRecruited', () => {
					set(busManager.getState());
				}),
				busManager.domainEventBus.subscribe('FacilityUpgraded', () => {
					set(busManager.getState());
				})
			];
		} catch {
			// BusManager not initialized yet - will be set up in +layout.svelte
		}
	}

	// Try to set up subscriptions immediately (will fail if BusManager not initialized)
	setupSubscriptions();

	return {
		subscribe,
		refresh: () => {
			try {
				const busManager = getBusManager();
				set(busManager.getState());
				// Set up subscriptions if not already done
				if (unsubscribeFunctions.length === 0) {
					setupSubscriptions();
				}
			} catch {
				// BusManager not initialized yet
			}
		}
	};
}

export const gameState = createGameStateStore();

/**
 * Derived stores for convenience
 */
export const resources: Readable<PlayerState['resources'] | null> = derived(
	gameState,
	($state) => $state?.resources ?? null
);

export const adventurers: Readable<PlayerState['adventurers']> = derived(
	gameState,
	($state) => $state?.adventurers ?? []
);

export const missions: Readable<PlayerState['missions']> = derived(
	gameState,
	($state) => $state?.missions ?? []
);

export const facilities: Readable<PlayerState['facilities'] | null> = derived(
	gameState,
	($state) => $state?.facilities ?? null
);

