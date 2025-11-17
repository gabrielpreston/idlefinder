/**
 * Bus Manager - wires all buses together
 * Singleton pattern for easy access throughout app
 */

import { CommandBus } from './CommandBus';
import { DomainEventBus } from './DomainEventBus';
import { TickBus } from './TickBus';
import { PersistenceBus } from './PersistenceBus';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';
import type { GameState } from '../domain/entities/GameState';
import type { DomainTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';

/**
 * Bus Manager - wires all buses together
 * Instance-based (no singleton) - created via startGame() factory
 * 
 * Note: Comment about singleton pattern removed - this is now instance-based
 */
export class BusManager {
	public readonly commandBus: CommandBus<GameState>;
	public readonly domainEventBus: DomainEventBus;
	public readonly tickBus: TickBus;
	public readonly persistenceBus: PersistenceBus;

	private state: GameState;
	private stateGetter: () => GameState;
	private stateSetter: (state: GameState) => void;
	private readonly timeSource: DomainTimeSource;

	constructor(initialState: GameState, timeSource: DomainTimeSource) {
		this.state = initialState;
		this.timeSource = timeSource;
		this.stateGetter = () => this.state;
		this.stateSetter = (state: GameState) => {
			this.state = state;
		};

		// Create buses
		this.domainEventBus = new DomainEventBus();
		this.commandBus = new CommandBus<GameState>(
			this.domainEventBus,
			this.stateGetter,
			this.stateSetter
		);
		this.tickBus = new TickBus(timeSource);

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
	getState(): GameState {
		return this.state;
	}

	/**
	 * Set state directly (for internal use by handlers)
	 */
	setState(state: GameState): void {
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
			const now = this.timeSource.now();
			const lastPlayedTimestamp = Timestamp.from(lastPlayed);
			const elapsed = now.value - lastPlayedTimestamp.value;

			if (elapsed > 0) {
				// Replay ticks for offline progression with incremental timestamps
				await this.tickBus.replayTicks(elapsed, 1000, lastPlayed);
			}
		}
	}
}

