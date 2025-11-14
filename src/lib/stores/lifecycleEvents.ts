/**
 * Enhanced bidirectional event bus aligned with game development best practices:
 *
 * 1. Performance: Event batching, priority queues, throttling
 * 2. Memory: Automatic cleanup tracking, weak references
 * 3. Reliability: Error isolation, event ordering, determinism
 * 4. Debugging: Event history, metrics, profiling
 * 5. Scalability: Event filtering, scoped subscriptions
 */

/**
 * Event priority levels (aligned with game loop priorities).
 */
export enum EventPriority {
	CRITICAL = 0, // Process immediately (state changes, errors)
	HIGH = 1, // Process in current batch (UI updates, animations)
	MEDIUM = 2, // Process in next batch (analytics, logging) - default
	LOW = 3 // Process when idle (cleanup, deferred updates)
}

/**
 * Event subscription options.
 */
export interface EventSubscriptionOptions {
	/**
	 * Filter function to determine if event should be handled.
	 */
	filter?: (detail: unknown) => boolean;
	/**
	 * If true, listener fires once and is automatically removed.
	 */
	once?: boolean;
	/**
	 * Event priority (affects processing order).
	 */
	priority?: EventPriority;
	/**
	 * Context object for automatic cleanup tracking.
	 */
	context?: object;
}

/**
 * Queued event with priority and sequence information.
 */
interface QueuedEvent {
	type: string;
	detail: unknown;
	priority: EventPriority;
	sequence: number;
	timestamp: number;
}

/**
 * Event history entry for debugging.
 */
interface EventHistoryEntry {
	type: string;
	timestamp: number;
	detail: unknown;
}

/**
 * Performance metrics.
 */
export interface EventMetrics {
	eventsDispatched: number;
	eventsProcessed: number;
	eventsDropped: number;
	averageProcessingTime: number;
	queueSize: number;
	activeListeners: Array<{ type: string; count: number }>;
}

/**
 * Enhanced bidirectional event bus with performance optimizations.
 */
class LifecycleEventBus {
	private static instance: LifecycleEventBus;

	private constructor() {
		// Private constructor for singleton pattern
	}

	static getInstance(): LifecycleEventBus {
		if (!LifecycleEventBus.instance) {
			LifecycleEventBus.instance = new LifecycleEventBus();
		}
		return LifecycleEventBus.instance;
	}

	// Event queue and batching
	private eventQueue: QueuedEvent[] = [];
	private isProcessingQueue = false;
	private readonly batchSize = 50; // Process up to 50 events per frame
	private readonly maxQueueSize = 1000; // Prevent memory issues
	private eventSequence = 0; // Sequence number for ordering guarantees

	// Event listeners
	private listeners = new Map<string, Set<(detail: unknown) => void>>();
	private listenerMetadata = new Map<
		(detail: unknown) => void,
		{ filter?: (detail: unknown) => boolean; once?: boolean }
	>();

	// Context-based cleanup tracking
	private activeSubscriptions = new WeakMap<object, Set<() => void>>();

	// Throttling
	private throttledEvents = new Map<
		string,
		{ lastDispatch: number; pending: unknown | null; timeoutId?: ReturnType<typeof setTimeout> }
	>();

	// Debugging and profiling
	private eventHistory: EventHistoryEntry[] = [];
	private readonly maxHistorySize = 100;
	private debugMode = false;

	// Performance metrics
	private metrics: EventMetrics = {
		eventsDispatched: 0,
		eventsProcessed: 0,
		eventsDropped: 0,
		averageProcessingTime: 0,
		queueSize: 0,
		activeListeners: []
	};

	/**
	 * Dispatches an event with priority.
	 * Critical events are processed immediately, others are batched.
	 *
	 * @param eventType Event type identifier
	 * @param detail Event detail data
	 * @param priority Event priority (default: MEDIUM)
	 */
	dispatch(eventType: string, detail: unknown, priority: EventPriority = EventPriority.MEDIUM): void {
		// Critical events bypass queue
		if (priority === EventPriority.CRITICAL) {
			this.processEventImmediately(eventType, detail);
			return;
		}

		// Prevent queue overflow
		if (this.eventQueue.length >= this.maxQueueSize) {
			console.warn(`[EventBus] Queue full, dropping event: ${eventType}`);
			this.metrics.eventsDropped++;
			return;
		}

		// Add to priority queue with sequence number
		const sequence = ++this.eventSequence;
		const event: QueuedEvent = {
			type: eventType,
			detail,
			priority,
			sequence,
			timestamp: performance.now()
		};

		// Insert maintaining priority order (lower priority number = higher priority)
		// Within same priority, maintain sequence order
		let insertIndex = this.eventQueue.length;
		for (let i = 0; i < this.eventQueue.length; i++) {
			if (
				this.eventQueue[i].priority > priority ||
				(this.eventQueue[i].priority === priority && this.eventQueue[i].sequence > sequence)
			) {
				insertIndex = i;
				break;
			}
		}
		this.eventQueue.splice(insertIndex, 0, event);

		this.metrics.eventsDispatched++;
		this.metrics.queueSize = this.eventQueue.length;

		// Start processing if not already running
		if (!this.isProcessingQueue) {
			this.processEventQueue();
		}
	}

	/**
	 * Processes events in batches using requestAnimationFrame.
	 * Ensures smooth 60 FPS by limiting events per frame.
	 */
	private processEventQueue(): void {
		if (this.eventQueue.length === 0) {
			this.isProcessingQueue = false;
			return;
		}

		this.isProcessingQueue = true;
		const startTime = performance.now();

		// Process batch
		let processed = 0;
		while (this.eventQueue.length > 0 && processed < this.batchSize) {
			const event = this.eventQueue.shift()!;
			this.processEventImmediately(event.type, event.detail);
			processed++;
		}

		// Update metrics
		const processingTime = performance.now() - startTime;
		this.metrics.eventsProcessed += processed;
		this.metrics.averageProcessingTime =
			this.metrics.averageProcessingTime * 0.9 + processingTime * 0.1;
		this.metrics.queueSize = this.eventQueue.length;

		// Schedule next batch if queue not empty
		if (this.eventQueue.length > 0) {
			requestAnimationFrame(() => this.processEventQueue());
		} else {
			this.isProcessingQueue = false;
		}
	}

	/**
	 * Processes an event immediately (critical path).
	 */
	private processEventImmediately(eventType: string, detail: unknown): void {
		// Record in history for debugging
		this.recordEvent(eventType, detail);

		// Dispatch to all listeners with error isolation
		const listeners = this.listeners.get(eventType);
		if (listeners) {
			const listenersToRemove: Array<(detail: unknown) => void> = [];

			listeners.forEach((handler) => {
				try {
					const metadata = this.listenerMetadata.get(handler);
					// Apply filter if present
					if (metadata?.filter && !metadata.filter(detail)) {
						return;
					}

					handler(detail);

					// Remove one-time listeners
					if (metadata?.once) {
						listenersToRemove.push(handler);
					}
				} catch (error) {
					// Isolate errors - don't break other handlers
					console.error(`[EventBus] Handler error for ${eventType}:`, error);

					// Dispatch error event for monitoring
					this.dispatch(
						'eventbus:handler-error',
						{
							eventType,
							error: error instanceof Error ? error.message : String(error)
						},
						EventPriority.CRITICAL
					);
				}
			});

			// Clean up one-time listeners
			for (const handler of listenersToRemove) {
				this.removeListener(eventType, handler);
			}
		}

		// Also dispatch via window for backward compatibility (if available)
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent(eventType, { detail }));
		}
	}

	/**
	 * Registers an event listener with optional filtering and cleanup tracking.
	 *
	 * @param eventType Event type identifier
	 * @param handler Event handler function
	 * @param options Subscription options (filter, once, priority, context)
	 * @returns Cleanup function to remove the listener
	 */
	on(
		eventType: string,
		handler: (detail: unknown) => void,
		options: EventSubscriptionOptions = {}
	): () => void {
		// Wrap handler with filter if provided
		const wrappedHandler = options.filter
			? (detail: unknown) => {
					if (options.filter!(detail)) {
						handler(detail);
					}
				}
			: handler;

		// Store metadata for filter and once behavior
		this.listenerMetadata.set(wrappedHandler, {
			filter: options.filter,
			once: options.once
		});

		// Add to listeners
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}
		this.listeners.get(eventType)!.add(wrappedHandler);

		// Track cleanup for context (component instance)
		const cleanup = () => {
			this.removeListener(eventType, wrappedHandler);
		};

		if (options.context) {
			if (!this.activeSubscriptions.has(options.context)) {
				this.activeSubscriptions.set(options.context, new Set());
			}
			this.activeSubscriptions.get(options.context)!.add(cleanup);
		}

		// Return cleanup function
		return cleanup;
	}

	/**
	 * Removes a listener from the event bus.
	 */
	private removeListener(eventType: string, handler: (detail: unknown) => void): void {
		const listeners = this.listeners.get(eventType);
		if (listeners) {
			listeners.delete(handler);
			this.listenerMetadata.delete(handler);
			if (listeners.size === 0) {
				this.listeners.delete(eventType);
			}
		}
	}

	/**
	 * Cleans up all subscriptions for a context (e.g., component destroy).
	 *
	 * @param context Context object used when subscribing
	 */
	cleanup(context: object): void {
		const subscriptions = this.activeSubscriptions.get(context);
		if (subscriptions) {
			subscriptions.forEach((cleanup) => cleanup());
			subscriptions.clear();
			this.activeSubscriptions.delete(context);
		}
	}

	/**
	 * Throttled event dispatch (useful for progress updates).
	 *
	 * @param eventType Event type identifier
	 * @param detail Event detail data
	 * @param throttleMs Throttle interval in milliseconds (default: 100ms)
	 * @param priority Event priority (default: LOW)
	 */
	dispatchThrottled(
		eventType: string,
		detail: unknown,
		throttleMs: number = 100,
		priority: EventPriority = EventPriority.LOW
	): void {
		const now = performance.now();
		const throttled = this.throttledEvents.get(eventType);

		if (!throttled || now - throttled.lastDispatch >= throttleMs) {
			// Dispatch immediately
			this.dispatch(eventType, detail, priority);
			this.throttledEvents.set(eventType, { lastDispatch: now, pending: null });
		} else {
			// Store pending event (will dispatch when throttle expires)
			const pending = throttled.pending !== null ? throttled.pending : detail;
			this.throttledEvents.set(eventType, { lastDispatch: throttled.lastDispatch, pending });

			// Clear existing timeout if any
			if (throttled.timeoutId) {
				clearTimeout(throttled.timeoutId);
			}

			// Schedule dispatch
			const timeoutId = setTimeout(() => {
				const currentThrottled = this.throttledEvents.get(eventType);
				if (currentThrottled && currentThrottled.pending !== null) {
					this.dispatch(eventType, currentThrottled.pending, priority);
					this.throttledEvents.delete(eventType);
				}
			}, throttleMs - (now - throttled.lastDispatch));

			this.throttledEvents.set(eventType, {
				lastDispatch: throttled.lastDispatch,
				pending,
				timeoutId
			});
		}
	}

	/**
	 * Records event in history for debugging.
	 */
	private recordEvent(eventType: string, detail: unknown): void {
		this.eventHistory.push({
			type: eventType,
			timestamp: performance.now(),
			detail: this.sanitizeForLogging(detail)
		});

		// Limit history size
		if (this.eventHistory.length > this.maxHistorySize) {
			this.eventHistory.shift();
		}

		// Debug logging
		if (this.debugMode) {
			console.log(`[EventBus] ${eventType}`, detail);
		}
	}

	/**
	 * Sanitizes event detail for logging (prevents circular references).
	 */
	private sanitizeForLogging(detail: unknown): unknown {
		try {
			return JSON.parse(JSON.stringify(detail));
		} catch {
			return String(detail);
		}
	}

	/**
	 * Gets current performance metrics.
	 */
	getMetrics(): EventMetrics {
		return {
			...this.metrics,
			activeListeners: Array.from(this.listeners.entries()).map(([type, handlers]) => ({
				type,
				count: handlers.size
			}))
		};
	}

	/**
	 * Gets event history with optional filtering.
	 *
	 * @param filter Optional filter for event type and time range
	 */
	getEventHistory(filter?: { type?: string; since?: number }): EventHistoryEntry[] {
		let history = [...this.eventHistory];

		if (filter?.type) {
			history = history.filter((e) => e.type === filter.type);
		}

		if (filter?.since) {
			const cutoff = performance.now() - filter.since;
			history = history.filter((e) => e.timestamp >= cutoff);
		}

		return history;
	}

	/**
	 * Enables or disables debug mode with verbose logging.
	 *
	 * @param enabled Whether to enable debug mode
	 */
	setDebugMode(enabled: boolean): void {
		this.debugMode = enabled;
		if (enabled) {
			console.log('[EventBus] Debug mode enabled');
		}
	}
}

export const lifecycleEvents = LifecycleEventBus.getInstance();

/**
 * Type definitions for lifecycle events.
 */
export interface TaskStatusChangedEvent {
	taskId: string;
	oldStatus: string;
	newStatus: string;
}

export interface TaskCompletedEvent {
	taskId: string;
	outcome?: string;
}

export interface TaskProgressUpdatedEvent {
	taskId: string;
	progress: number;
}

export interface AgentStatusChangedEvent {
	agentId: string;
	oldStatus: string;
	newStatus: string;
}

export interface AgentXpGainedEvent {
	agentId: string;
	amount: number;
	newTotal: number;
}

export interface AgentLevelUpEvent {
	agentId: string;
	oldLevel: number;
	newLevel: number;
}

export interface AgentInjuredEvent {
	agentId: string;
}

export interface AgentRecoveredEvent {
	agentId: string;
}
