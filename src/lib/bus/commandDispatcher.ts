/**
 * Command Dispatcher - helper for dispatching commands from UI
 * Uses module-level variable pattern (same as gameState store)
 */

import type { Command, CommandType, CommandPayload } from './types';
import type { GameRuntime } from '../runtime/startGame';

// Module-level variable to hold runtime instance
let runtimeInstance: GameRuntime | null = null;

/**
 * Initialize command dispatcher with runtime instance
 * Must be called before using dispatchCommand
 * @param runtime Game runtime instance
 */
export function initializeCommandDispatcher(runtime: GameRuntime): void {
	if (!runtime) {
		throw new Error('GameRuntime cannot be null when initializing command dispatcher');
	}
	runtimeInstance = runtime;
}

/**
 * Get the current runtime instance (for advanced use cases like DevTools)
 * @returns Current runtime instance or null if not initialized
 */
export function getRuntime(): GameRuntime | null {
	return runtimeInstance;
}

/**
 * Reset command dispatcher (for testing)
 */
export function resetCommandDispatcher(): void {
	runtimeInstance = null;
}

/**
 * Dispatch a command
 * @param type Command type
 * @param payload Command payload
 */
export async function dispatchCommand<T extends CommandPayload>(
	type: CommandType,
	payload: T
): Promise<void> {
	if (!runtimeInstance) {
		throw new Error('Command dispatcher not initialized. Call initializeCommandDispatcher() first.');
	}
	const command: Command = {
		type,
		payload,
		timestamp: new Date().toISOString()
	};
	await runtimeInstance.busManager.commandBus.dispatch(command);
}

