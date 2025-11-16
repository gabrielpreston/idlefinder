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
	 */
	async dispatch(command: Command): Promise<void> {
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

