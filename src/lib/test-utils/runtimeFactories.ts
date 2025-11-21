/**
 * Runtime Factories - Optimized runtime creation for different test scenarios
 * Provides lightweight, full, and cached runtime options
 * 
 * Updated to use unified bootstrapTestGame() for proper initialization
 */

import type { GameState } from '../domain/entities/GameState';
import type { GameRuntime } from '../runtime/startGame';
import { createMockGameRuntime } from './componentTestHelpers';
import { createTestGameState } from './testFactories';
import { bootstrapTestGame, bootstrapTestGameSync } from './testBootstrap';

/**
 * Create lightweight runtime without handlers or store initialization
 * Use for UI-only tests that don't need command handlers
 * ~50ms setup time (vs ~150ms for full runtime)
 * 
 * @deprecated Use createFullRuntimeSync() for sync version or createFullRuntime() for async
 */
export function createLightweightRuntime(initialState?: GameState): GameRuntime {
	const state = initialState || createTestGameState();
	return createMockGameRuntime(state);
}

/**
 * Create full runtime with handlers and store initialization
 * Use for integration tests that need command handlers
 * ~150ms setup time
 * 
 * Now uses bootstrapTestGame() to ensure proper initialization sequence
 */
export async function createFullRuntime(initialState?: GameState): Promise<GameRuntime> {
	return await bootstrapTestGame({ initialState });
}

/**
 * Create full runtime synchronously (skips initialize)
 * Use for edge cases where async initialization is not needed
 */
export function createFullRuntimeSync(initialState?: GameState): GameRuntime {
	return bootstrapTestGameSync(initialState);
}

/**
 * Create cached runtime - reuses runtime when state is the same
 * Use when multiple tests need the same initial state
 * Cache is cleared on cleanup
 */
let cachedRuntime: GameRuntime | null = null;
let cachedStateHash: string | null = null;

export async function createCachedRuntime(initialState?: GameState): Promise<GameRuntime> {
	const state = initialState || createTestGameState();
	// Simple hash based on entity count and resource values
	const stateHash = `${state.entities.size}-${state.resources.get('gold')}-${state.resources.get('fame')}-${state.resources.get('materials')}`;
	
	if (cachedRuntime && cachedStateHash === stateHash) {
		return cachedRuntime;
	}
	
	// Clear old cache if exists
	if (cachedRuntime) {
		cachedRuntime.destroy();
	}
	
	cachedRuntime = await createFullRuntime(state);
	cachedStateHash = stateHash;
	return cachedRuntime;
}

/**
 * Clear cached runtime
 * Call this in test cleanup
 */
export function clearCachedRuntime(): void {
	if (cachedRuntime) {
		cachedRuntime.destroy();
		cachedRuntime = null;
		cachedStateHash = null;
	}
}

