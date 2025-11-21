/**
 * Test Bootstrap - Unified test game initialization
 * Mirrors real game initialization sequence from +layout.svelte
 */

import type { GameState } from '../domain/entities/GameState';
import type { GameRuntime } from '../runtime/startGame';
import { startGame } from '../runtime/startGame';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import { gameState } from '../stores/gameState';
import { initializeCommandDispatcher } from '../bus/commandDispatcher';
import { createTestGameState } from './testFactories';

/**
 * Bootstrap test game - mirrors real game initialization exactly
 * 
 * Sequence matches +layout.svelte:73-84:
 * 1. await runtime.busManager.initialize() - Handles offline catch-up
 * 2. runtime.refreshGameState() - Syncs runtime store
 * 3. gameState.initialize(runtime) - Initializes Svelte store
 * 4. initializeCommandDispatcher(runtime) - Initializes command dispatcher
 * 
 * @param options Configuration options
 * @param options.initialState Optional initial game state (uses default if not provided)
 * @param options.skipInitialize If true, skips busManager.initialize() call (for edge cases)
 * @returns Initialized game runtime
 */
export async function bootstrapTestGame(options?: {
	initialState?: GameState;
	skipInitialize?: boolean;
}): Promise<GameRuntime> {
	const state = options?.initialState || createTestGameState();
	const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
	// Note: startGame() already calls registerHandlers() internally
	
	if (!options?.skipInitialize) {
		// CRITICAL: Matches +layout.svelte:74
		await runtime.busManager.initialize();
	}
	
	// Matches +layout.svelte:77
	runtime.refreshGameState();
	
	// Matches +layout.svelte:81
	gameState.initialize(runtime);
	
	// Matches +layout.svelte:84
	initializeCommandDispatcher(runtime);
	
	return runtime;
}

/**
 * Bootstrap test game synchronously (skips initialize)
 * Use for edge cases where async initialization is not needed
 * 
 * @param initialState Optional initial game state
 * @returns Game runtime (not fully initialized)
 */
export function bootstrapTestGameSync(initialState?: GameState): GameRuntime {
	const state = initialState || createTestGameState();
	const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
	runtime.refreshGameState();
	gameState.initialize(runtime);
	initializeCommandDispatcher(runtime);
	return runtime;
}

