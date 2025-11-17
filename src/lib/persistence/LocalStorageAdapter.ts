/**
 * LocalStorage Adapter - client-side persistence
 * Matches design spec: docs/design/03-data-and-persistence-design.md lines 90-111
 * Uses DTO layer for persistence
 */

import type { GameState } from '../domain/entities/GameState';
import type { GameStateDTO } from './dto/GameStateDTO';
import { domainToDTO, dtoToDomain } from './mappers/GameStateMapper';
import { Timestamp } from '../domain/valueObjects/Timestamp';

const STORAGE_KEY = 'idlefinder_state';

/**
 * Get localStorage safely (works in browser and test environments)
 * Returns null if localStorage is not available (e.g., SSR)
 */
function getLocalStorage(): Storage | null {
	if (typeof window !== 'undefined' && window.localStorage) {
		return window.localStorage;
	}
	if (typeof global !== 'undefined' && (global as typeof globalThis).localStorage) {
		return (global as typeof globalThis).localStorage;
	}
	return null;
}

/**
 * LocalStorage adapter - matches design spec
 * Uses DTO layer for serialization
 */
export class LocalStorageAdapter {
	/**
	 * Save current state to localStorage
	 * Converts domain model to DTO before serialization
	 * No-op if localStorage is not available (e.g., SSR)
	 */
	save(state: GameState): void {
		const storage = getLocalStorage();
		if (!storage) {
			return;
		}

		try {
			// Update lastPlayed timestamp
			const stateWithTimestamp = state.updateLastPlayed(Timestamp.now());
			
			// Convert to DTO and serialize
			const dto = domainToDTO(stateWithTimestamp);
			storage.setItem(STORAGE_KEY, JSON.stringify(dto));
		} catch (error) {
			console.error('[Persistence] Save error:', error);
		}
	}

	/**
	 * Load state from localStorage
	 * Deserializes DTO and converts to domain model
	 * Returns null if localStorage is not available (e.g., SSR)
	 */
	load(): GameState | null {
		const storage = getLocalStorage();
		if (!storage) {
			return null;
		}

		try {
			const stored = storage.getItem(STORAGE_KEY);
			if (!stored) {
				return null;
			}

			const dto: GameStateDTO = JSON.parse(stored);

			// Convert DTO to domain (handles version migration)
			return dtoToDomain(dto);
		} catch (error) {
			console.error('[Persistence] Load error:', error);
			return null;
		}
	}

	/**
	 * Get last played timestamp for offline catch-up
	 */
	getLastPlayed(): Date | null {
		const state = this.load();
		if (!state || !state.lastPlayed) {
			return null;
		}
		return new Date(state.lastPlayed.value);
	}

	/**
	 * Clear saved state from localStorage
	 * Useful for testing and resetting game state
	 * No-op if localStorage is not available (e.g., SSR)
	 */
	clear(): void {
		const storage = getLocalStorage();
		if (!storage) {
			return;
		}

		try {
			storage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error('[Persistence] Clear error:', error);
		}
	}
}

