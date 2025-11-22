/**
 * Domain Event Bus - publish/subscribe for domain events
 * Matches design spec: docs/design/06-message-bus-architecture.md lines 76-128
 * 
 * Multiple listeners per event type, error isolation, async handling
 */

import type { DomainEvent, DomainEventType } from './types';

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * Domain Event Bus - publish/subscribe for domain events
 * Matches design spec: multiple listeners per event type
 */
export class DomainEventBus {
	private listeners = new Map<DomainEventType, Set<EventHandler>>();

	/**
	 * Subscribe to domain events
	 * @param eventType Event type to subscribe to
	 * @param handler Handler function that receives event payload
	 * @returns Unsubscribe function
	 */
	subscribe<T>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}
		const handlers = this.listeners.get(eventType);
		if (handlers) {
			handlers.add(handler as EventHandler);
		}

		// Return unsubscribe function
		return () => {
			const handlers = this.listeners.get(eventType);
			if (handlers) {
				handlers.delete(handler as EventHandler);
				if (handlers.size === 0) {
					this.listeners.delete(eventType);
				}
			}
		};
	}

	/**
	 * Publish a domain event
	 * All subscribers are notified, errors are isolated
	 */
	async publish(event: DomainEvent): Promise<void> {
		const handlers = this.listeners.get(event.type);
		if (!handlers) {
			return;
		}

		// Call all handlers (isolate errors - handler errors don't break other handlers)
		const promises = Array.from(handlers).map(async (handler) => {
			try {
				await handler(event.payload);
			} catch (error) {
				console.error(`[DomainEventBus] Handler error for ${event.type}:`, error);
			}
		});

		await Promise.all(promises);
	}
}

