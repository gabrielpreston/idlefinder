/**
 * Bus Manager - wires all buses together
 * Singleton pattern for easy access throughout app
 */

import { CommandBus } from './CommandBus';
import { DomainEventBus } from './DomainEventBus';
import { TickBus } from './TickBus';
import { PersistenceBus } from './PersistenceBus';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';
import type { PlayerState } from '../domain/entities/PlayerState';

/**
 * Bus Manager - wires all buses together
 * Singleton pattern for easy access throughout app
 */
export class BusManager {
	public readonly commandBus: CommandBus<PlayerState>;
	public readonly domainEventBus: DomainEventBus;
	public readonly tickBus: TickBus;
	public readonly persistenceBus: PersistenceBus;

	private state: PlayerState;
	private stateGetter: () => PlayerState;
	private stateSetter: (state: PlayerState) => void;

	constructor(initialState: PlayerState) {
		this.state = initialState;
		this.stateGetter = () => this.state;
		this.stateSetter = (state: PlayerState) => {
			this.state = state;
		};

		// Create buses
		this.domainEventBus = new DomainEventBus();
		this.commandBus = new CommandBus<PlayerState>(
			this.domainEventBus,
			this.stateGetter,
			this.stateSetter
		);
		this.tickBus = new TickBus();

		const adapter = new LocalStorageAdapter();
		this.persistenceBus = new PersistenceBus(
			adapter,
			this.stateGetter,
			this.domainEventBus
		);
	}

	/**
	 * Get current game state
	 */
	getState(): PlayerState {
		return this.state;
	}

	/**
	 * Set state directly (for internal use by handlers)
	 */
	setState(state: PlayerState): void {
		this.state = state;
	}

	/**
	 * Initialize game - load state and handle offline catch-up
	 */
	async initialize(): Promise<void> {
		// Load saved state
		const savedState = this.persistenceBus.load();
		if (savedState) {
			this.state = savedState;
		}

		// Handle offline catch-up
		const lastPlayed = this.persistenceBus.getLastPlayed();
		if (lastPlayed) {
			const now = new Date();
			const elapsed = now.getTime() - lastPlayed.getTime();

			if (elapsed > 0) {
				// Replay ticks for offline progression with incremental timestamps
				await this.tickBus.replayTicks(elapsed, 1000, lastPlayed);
			}
		}
	}
}

// Singleton instance
let busManager: BusManager | null = null;

/**
 * Get the singleton BusManager instance
 * Throws if not initialized - call initializeBusManager() first
 */
export function getBusManager(): BusManager {
	if (!busManager) {
		throw new Error('BusManager not initialized. Call initializeBusManager() first.');
	}
	return busManager;
}

/**
 * Initialize the singleton BusManager
 * @param initialState Initial player state (will be replaced with saved state if available)
 */
export function initializeBusManager(initialState: PlayerState): BusManager {
	if (busManager) {
		return busManager;
	}
	busManager = new BusManager(initialState);
	return busManager;
}

/**
 * Reset the singleton BusManager (for testing/debugging)
 * WARNING: This will destroy the current instance - use with caution!
 */
export function resetBusManager(): void {
	busManager = null;
}

