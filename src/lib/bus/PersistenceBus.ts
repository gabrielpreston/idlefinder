/**
 * Persistence Bus - handles save/load operations
 * Matches design spec: docs/design/06-message-bus-architecture.md lines 171-231
 * 
 * Listens to domain events, saves periodically with debouncing
 */

import type { DomainEventType } from './types';
import { DomainEventBus } from './DomainEventBus';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';
import type { PlayerState } from '../domain/entities/PlayerState';

/**
 * Persistence Bus - handles save/load operations
 * Matches design spec: listens to domain events, saves periodically
 */
export class PersistenceBus {
	private adapter: LocalStorageAdapter;
	private stateGetter: () => PlayerState;
	private saveTimeout: ReturnType<typeof setTimeout> | null = null;
	private readonly saveIntervalMs = 10000; // 10 seconds

	constructor(
		adapter: LocalStorageAdapter,
		stateGetter: () => PlayerState,
		eventBus: DomainEventBus
	) {
		this.adapter = adapter;
		this.stateGetter = stateGetter;

		// Critical events that need immediate save (user-initiated actions)
		const immediateSaveEvents: DomainEventType[] = [
			'FacilityUpgraded',      // User spends resources
			'AdventurerRecruited',   // User creates permanent state
			'MissionStarted'         // User commits adventurers
		];

		// Events that can be debounced (automatic or frequent)
		const debouncedSaveEvents: DomainEventType[] = [
			'MissionCompleted',      // Automatic via tick system
			'ResourcesChanged'       // Frequent, usually accompanies other events
		];

		// Immediate save for critical events
		for (const eventType of immediateSaveEvents) {
			eventBus.subscribe(eventType, () => {
				this.save(); // Immediate save
			});
		}

		// Debounced save for less critical events
		for (const eventType of debouncedSaveEvents) {
			eventBus.subscribe(eventType, () => {
				this.scheduleSave(); // Debounced save
			});
		}

		// Flush pending saves on page unload
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => {
				this.flush();
			});
		}
	}

	/**
	 * Schedule a save (debounced)
	 */
	private scheduleSave(): void {
		if (this.saveTimeout !== null) {
			clearTimeout(this.saveTimeout);
		}

		this.saveTimeout = setTimeout(() => {
			this.save();
		}, this.saveIntervalMs);
	}

	/**
	 * Save current state to localStorage
	 */
	private save(): void {
		// Don't save if we're in the middle of a reset
		if (typeof window !== 'undefined' && sessionStorage.getItem('__resetting') === 'true') {
			return;
		}
		
		const state = this.stateGetter();
		this.adapter.save(state);
	}

	/**
	 * Load state from localStorage
	 */
	load(): PlayerState | null {
		return this.adapter.load();
	}

	/**
	 * Get last played timestamp for offline catch-up
	 */
	getLastPlayed(): Date | null {
		return this.adapter.getLastPlayed();
	}

	/**
	 * Flush any pending saves immediately
	 * Called on page unload to prevent data loss
	 */
	flush(): void {
		if (this.saveTimeout !== null) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}
		this.save();
	}

	/**
	 * Clear saved state from localStorage
	 * Useful for testing and resetting game state
	 */
	clear(): void {
		this.adapter.clear();
	}
}

