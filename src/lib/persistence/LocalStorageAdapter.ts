/**
 * LocalStorage Adapter - client-side persistence
 * Matches design spec: docs/design/03-data-and-persistence-design.md lines 90-111
 */

import type { PlayerState } from '../domain/entities/PlayerState';

const STORAGE_KEY = 'idlefinder_state';
const VERSION = 1;

export interface StoredState {
	version: number;
	state: PlayerState;
}

/**
 * LocalStorage adapter - matches design spec
 */
export class LocalStorageAdapter {
	/**
	 * Save current state to localStorage
	 */
	save(state: PlayerState): void {
		try {
			const stored: StoredState = {
				version: VERSION,
				state: {
					...state,
					lastPlayed: new Date().toISOString()
				}
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
		} catch (error) {
			console.error('[Persistence] Save error:', error);
		}
	}

	/**
	 * Load state from localStorage
	 */
	load(): PlayerState | null {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				return null;
			}

			const parsed: StoredState = JSON.parse(stored);

			// Handle version migration if needed
			if (parsed.version !== VERSION) {
				return this.migrate(parsed);
			}

			return parsed.state;
		} catch (error) {
			console.error('[Persistence] Load error:', error);
			return null;
		}
	}

	/**
	 * Migrate state from older versions
	 */
	private migrate(stored: StoredState): PlayerState {
		// Migration logic for future versions
		// For now, just return the state as-is
		return stored.state;
	}

	/**
	 * Get last played timestamp for offline catch-up
	 */
	getLastPlayed(): Date | null {
		const state = this.load();
		if (!state || !state.lastPlayed) {
			return null;
		}
		return new Date(state.lastPlayed);
	}
}

