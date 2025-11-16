/**
 * Command Bus - routes commands to handlers
 * Matches design spec: docs/design/06-message-bus-architecture.md lines 19-75
 * 
 * One handler per command type, emits domain events, returns void
 */

import type { Command, CommandType, CommandPayload, DomainEvent } from './types';
import { DomainEventBus } from './DomainEventBus';

export type CommandHandler<T extends CommandPayload = CommandPayload, S = unknown> = (
	payload: T,
	state: S
) => Promise<{ newState: S; events: DomainEvent[] }>;

/**
 * Command Bus - routes commands to handlers
 * Matches design spec: one handler per command type, emits domain events
 */
export class CommandBus<S = unknown> {
	private handlers = new Map<CommandType, CommandHandler<CommandPayload, S>>();
	private domainEventBus: DomainEventBus;
	private stateGetter: () => S;
	private stateSetter: (state: S) => void;
	private commandQueue: Array<{ command: Command; resolve: () => void; reject: (error: Error) => void }> = [];
	private isProcessing = false;

	constructor(
		domainEventBus: DomainEventBus,
		stateGetter: () => S,
		stateSetter: (state: S) => void
	) {
		this.domainEventBus = domainEventBus;
		this.stateGetter = stateGetter;
		this.stateSetter = stateSetter;
	}

	/**
	 * Register a command handler
	 * @param commandType Command type
	 * @param handler Handler function
	 */
	register<T extends CommandPayload>(
		commandType: CommandType,
		handler: CommandHandler<T, S>
	): void {
		this.handlers.set(commandType, handler as CommandHandler<CommandPayload, S>);
	}

	/**
	 * Dispatch a command
	 * Returns void - results propagate via domain events
	 * Commands are queued and executed sequentially to prevent race conditions
	 */
	async dispatch(command: Command): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.commandQueue.push({ command, resolve, reject });
			if (!this.isProcessing) {
				// Process queue immediately if not already processing
				// This ensures commands execute synchronously when possible
				this.processQueue();
			}
		});
	}

	/**
	 * Process command queue sequentially
	 */
	private async processQueue(): Promise<void> {
		this.isProcessing = true;
		while (this.commandQueue.length > 0) {
			const queueItem = this.commandQueue.shift()!;
			try {
				await this.executeCommand(queueItem.command);
				queueItem.resolve();
			} catch (error) {
				queueItem.reject(error instanceof Error ? error : new Error(String(error)));
			}
		}
		this.isProcessing = false;
	}

	/**
	 * Execute a single command
	 */
	private async executeCommand(command: Command): Promise<void> {
		const handler = this.handlers.get(command.type as CommandType);
		if (!handler) {
			// Emit CommandFailed event
			const failedEvent: DomainEvent = {
				type: 'CommandFailed',
				payload: {
					commandType: command.type,
					reason: `No handler registered for command type: ${command.type}`
				},
				timestamp: command.timestamp,
				metadata: command.metadata
			};
			await this.domainEventBus.publish(failedEvent);
			return;
		}

		try {
			// Get current state
			const currentState = this.stateGetter();

			// Execute handler
			const result = await handler(command.payload as CommandPayload, currentState);

			// Update state
			this.stateSetter(result.newState);

			// Publish all domain events
			for (const event of result.events) {
				await this.domainEventBus.publish(event);
			}
		} catch (error) {
			// Emit CommandFailed event
			const failedEvent: DomainEvent = {
				type: 'CommandFailed',
				payload: {
					commandType: command.type,
					reason: error instanceof Error ? error.message : String(error)
				},
				timestamp: command.timestamp,
				metadata: command.metadata
			};
			await this.domainEventBus.publish(failedEvent);
		}
	}
}

