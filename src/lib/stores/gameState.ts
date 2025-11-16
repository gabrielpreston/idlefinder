/**
 * Game State Store - reactive Svelte store for game state
 * Replaces organizationStore - provides reactive access to PlayerState
 * 
 * Now uses GameRuntime from Svelte context instead of singleton
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { PlayerState } from '../domain/entities/PlayerState';
import type { GameRuntime } from '../runtime/startGame';

/**
 * Game state store - reactive wrapper around runtime's playerState
 */
function createGameStateStore() {
	const { subscribe, set } = writable<PlayerState | null>(null);
	let runtime: GameRuntime | null = null;

	return {
		subscribe,
		initialize: (rt: GameRuntime) => {
			runtime = rt;
			// Use runtime's playerState store
			const unsubscribe = rt.playerState.subscribe((state) => {
				set(state);
			});
			// Store unsubscribe in runtime's destroy (will be called on cleanup)
			const originalDestroy = rt.destroy;
			rt.destroy = () => {
				unsubscribe();
				originalDestroy();
			};
		},
		refresh: () => {
			if (runtime) {
				set(runtime.busManager.getState());
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

