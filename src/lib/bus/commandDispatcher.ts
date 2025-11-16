/**
 * Command Dispatcher - helper for dispatching commands from UI
 */

import { getBusManager } from './BusManager';
import type { Command, CommandType, CommandPayload } from './types';

/**
 * Dispatch a command
 */
export async function dispatchCommand<T extends CommandPayload>(
	type: CommandType,
	payload: T
): Promise<void> {
	const busManager = getBusManager();
	const command: Command = {
		type,
		payload,
		timestamp: new Date().toISOString()
	};
	await busManager.commandBus.dispatch(command);
}

