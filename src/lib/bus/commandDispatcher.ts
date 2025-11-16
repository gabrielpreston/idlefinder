/**
 * Command Dispatcher - helper for dispatching commands from UI
 */

import type { Command, CommandType, CommandPayload } from './types';
import type { GameRuntime } from '../runtime/startGame';

/**
 * Dispatch a command
 * @param runtime Game runtime instance (from Svelte context)
 * @param type Command type
 * @param payload Command payload
 */
export async function dispatchCommand<T extends CommandPayload>(
	runtime: GameRuntime,
	type: CommandType,
	payload: T
): Promise<void> {
	const command: Command = {
		type,
		payload,
		timestamp: new Date().toISOString()
	};
	await runtime.busManager.commandBus.dispatch(command);
}

