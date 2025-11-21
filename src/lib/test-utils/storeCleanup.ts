/**
 * Store Cleanup Utilities - Reset singleton stores between tests
 * Prevents state leakage and ensures test isolation
 */

import { gameState } from '../stores/gameState';
import { resetCommandDispatcher } from '../bus/commandDispatcher';

/**
 * Reset all singleton stores to their initial state
 * Call this in afterEach hooks to ensure test isolation
 */
export function cleanupStores(): void {
	gameState.reset();
	resetCommandDispatcher();
}

