/**
 * Tick/Scheduler Bus - emits periodic tick events
 * Matches design spec: docs/design/06-message-bus-architecture.md lines 129-170
 * 
 * Emits Tick messages for time-based logic, supports offline catch-up via tick replay
 */

// TickBus emits tick events - TickMessage type defined in types.ts for reference

export type TickHandler = (deltaMs: number, timestamp: Date) => void | Promise<void>;

/**
 * Tick/Scheduler Bus - emits periodic tick events
 * Matches design spec: emits Tick messages for time-based logic
 */
export class TickBus {
	private handlers = new Set<TickHandler>();
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private lastTick: number = Date.now();
	private readonly tickIntervalMs: number = 1000; // 1 second default

	/**
	 * Subscribe to tick events
	 * @param handler Handler function that receives deltaMs and timestamp
	 * @returns Unsubscribe function
	 */
	subscribe(handler: TickHandler): () => void {
		this.handlers.add(handler);

		// Start ticking if not already started
		if (this.intervalId === null) {
			this.start();
		}

		// Return unsubscribe function
		return () => {
			this.handlers.delete(handler);
			if (this.handlers.size === 0) {
				this.stop();
			}
		};
	}

	/**
	 * Start emitting ticks
	 */
	private start(): void {
		this.lastTick = Date.now();
		this.intervalId = setInterval(() => {
			const now = Date.now();
			const deltaMs = now - this.lastTick;
			this.lastTick = now;

			this.emitTick(deltaMs, new Date());
		}, this.tickIntervalMs);
	}

	/**
	 * Stop emitting ticks
	 */
	private stop(): void {
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Emit tick to all handlers
	 */
	private async emitTick(deltaMs: number, timestamp: Date): Promise<void> {
		const promises = Array.from(this.handlers).map(async (handler) => {
			try {
				await handler(deltaMs, timestamp);
			} catch (error) {
				console.error('[TickBus] Handler error:', error);
			}
		});

		await Promise.all(promises);
	}

	/**
	 * Replay ticks for offline catch-up
	 * Matches design spec: synthetic tick sequence for elapsed time
	 * @param elapsedMs Elapsed time in milliseconds
	 * @param tickIntervalMs Tick interval in milliseconds (default: 1000)
	 */
	async replayTicks(elapsedMs: number, tickIntervalMs: number = 1000): Promise<void> {
		const numTicks = Math.floor(elapsedMs / tickIntervalMs);
		const now = new Date();

		// Replay full ticks
		for (let i = 0; i < numTicks; i++) {
			await this.emitTick(tickIntervalMs, now);
		}

		// Handle remainder
		const remainder = elapsedMs % tickIntervalMs;
		if (remainder > 0) {
			await this.emitTick(remainder, now);
		}
	}
}

