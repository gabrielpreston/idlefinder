/**
 * Component Test Helpers - Utilities for testing Svelte components with game state
 */

import { writable, type Readable } from 'svelte/store';
import type { GameState } from '../domain/entities/GameState';
import type { GameRuntime } from '../runtime/startGame';
import { createTestGameState } from './testFactories';
import { BusManager } from '../bus/BusManager';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';

/**
 * Create mock GameRuntime for component testing
 */
export function createMockGameRuntime(initialState?: GameState): GameRuntime {
	const state = initialState || createTestGameState();
	const gameStateStore = writable<GameState>(state);
	const timeSource = new SimulatedTimeSource(Timestamp.now());
	const busManager = new BusManager(state, timeSource);
	
	return {
		busManager,
		timeSource,
		gameState: {
			subscribe: gameStateStore.subscribe
		} as Readable<GameState>,
		refreshGameState: () => {
			gameStateStore.set(busManager.getState());
		},
		destroy: () => {}
	};
}


/**
 * Update game state in mock runtime
 */
export function updateGameState(runtime: GameRuntime, newState: GameState): void {
	runtime.busManager.setState(newState);
	runtime.refreshGameState();
}

