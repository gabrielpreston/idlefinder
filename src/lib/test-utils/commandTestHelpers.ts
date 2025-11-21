/**
 * Command Dispatcher Test Helpers
 * Provides initialization helpers for testing components that use command dispatcher
 */

import type { GameState } from '../domain/entities/GameState';
import { bootstrapTestGame } from './testBootstrap';

/**
 * Initialize command dispatcher for testing
 * Uses bootstrapTestGame to create a fully initialized runtime
 * Pattern matches real game initialization from +layout.svelte
 * 
 * @param initialState Optional initial game state (uses default if not provided)
 */
export async function initializeCommandDispatcherForTesting(initialState?: GameState): Promise<void> {
	// bootstrapTestGame already handles all initialization including command dispatcher
	await bootstrapTestGame({ initialState });
}

