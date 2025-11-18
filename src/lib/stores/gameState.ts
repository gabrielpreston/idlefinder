/**
 * Game State Store - reactive Svelte store for game state
 * Provides reactive access to GameState
 * 
 * Now uses GameRuntime from Svelte context instead of singleton
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { GameState } from '../domain/entities/GameState';
import type { GameRuntime } from '../runtime/startGame';
import type { Adventurer } from '../domain/entities/Adventurer';
import type { Mission } from '../domain/entities/Mission';
import type { Facility } from '../domain/entities/Facility';
import type { ResourceSlot } from '../domain/entities/ResourceSlot';

/**
 * Game state store - reactive wrapper around runtime's gameState
 */
function createGameStateStore() {
	const { subscribe, set } = writable<GameState | null>(null);
	let runtime: GameRuntime | null = null;

	return {
		subscribe,
		initialize: (rt: GameRuntime) => {
			runtime = rt;
			// Use runtime's gameState store
			const unsubscribe = rt.gameState.subscribe((state: GameState) => {
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
export const resources: Readable<GameState['resources'] | null> = derived(
	gameState,
	($state) => $state?.resources ?? null
);

export const adventurers: Readable<Adventurer[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return Array.from($state.entities.values()).filter(
			(e) => e.type === 'Adventurer'
		) as Adventurer[];
	}
);

export const missions: Readable<Mission[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return Array.from($state.entities.values()).filter(
			(e) => e.type === 'Mission'
		) as Mission[];
	}
);

export const facilities: Readable<Facility[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return Array.from($state.entities.values()).filter(
			(e) => e.type === 'Facility'
		) as Facility[];
	}
);

export const slots: Readable<ResourceSlot[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return Array.from($state.entities.values()).filter(
			(e) => e.type === 'ResourceSlot'
		) as ResourceSlot[];
	}
);

export const items: Readable<import('../domain/entities/Item').Item[]> = derived(
	gameState,
	($state) => {
		if (!$state) return [];
		return Array.from($state.entities.values()).filter(
			(e) => e.type === 'Item'
		) as import('../domain/entities/Item').Item[];
	}
);

export const craftingQueue: Readable<import('../domain/entities/CraftingQueue').CraftingQueue | undefined> = derived(
	gameState,
	($state) => {
		if (!$state) return undefined;
		return Array.from($state.entities.values())
			.find((e) => e.type === 'CraftingQueue') as import('../domain/entities/CraftingQueue').CraftingQueue | undefined;
	}
);

export const missionDoctrine: Readable<import('../domain/entities/MissionDoctrine').MissionDoctrine | undefined> = derived(
	gameState,
	($state) => {
		if (!$state) return undefined;
		return Array.from($state.entities.values())
			.find((e) => e.type === 'MissionDoctrine') as import('../domain/entities/MissionDoctrine').MissionDoctrine | undefined;
	}
);

export const autoEquipRules: Readable<import('../domain/entities/AutoEquipRules').AutoEquipRules | undefined> = derived(
	gameState,
	($state) => {
		if (!$state) return undefined;
		return Array.from($state.entities.values())
			.find((e) => e.type === 'AutoEquipRules') as import('../domain/entities/AutoEquipRules').AutoEquipRules | undefined;
	}
);

