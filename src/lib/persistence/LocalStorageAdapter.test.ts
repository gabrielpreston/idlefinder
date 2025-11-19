/**
 * LocalStorageAdapter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { createTestGameState } from '../test-utils/testFactories';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import { setupMockLocalStorage } from '../test-utils/mockLocalStorage';

describe('LocalStorageAdapter', () => {
	let adapter: LocalStorageAdapter;

	beforeEach(() => {
		setupMockLocalStorage();
		adapter = new LocalStorageAdapter();
	});

	describe('save', () => {
		it('should save state to localStorage', () => {
			const state = createTestGameState();
			const now = Timestamp.now();

			adapter.save(state, now);

			const stored = localStorage.getItem('idlefinder_state');
			expect(stored).toBeTruthy();
			const parsed = JSON.parse(stored!);
			expect(parsed.playerId).toBe(state.playerId);
		});

		it('should update lastPlayed timestamp', () => {
			const state = createTestGameState();
			const now = Timestamp.now();
			const future = Timestamp.from(now.value + 1000);

			adapter.save(state, future);

			const stored = localStorage.getItem('idlefinder_state');
			const parsed = JSON.parse(stored!);
			expect(parsed.lastPlayed).toBe(future.value.toString());
		});

		it('should handle save errors gracefully', () => {
			const state = createTestGameState();
			const now = Timestamp.now();
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			// Mock localStorage.setItem to throw
			vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
				throw new Error('Storage quota exceeded');
			});

			adapter.save(state, now);

			expect(consoleErrorSpy).toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
		});

		it('should handle localStorage unavailable (SSR)', () => {
			// Remove localStorage
			delete (global as any).localStorage;
			delete (global as any).window;

			const state = createTestGameState();
			const now = Timestamp.now();

			// Should not throw
			adapter.save(state, now);
		});
	});

	describe('load', () => {
		it('should load state from localStorage', () => {
			const state = createTestGameState();
			const now = Timestamp.now();
			adapter.save(state, now);

			const loaded = adapter.load();

			expect(loaded).toBeTruthy();
			expect(loaded?.playerId).toBe(state.playerId);
		});

		it('should return null when no state exists', () => {
			const loaded = adapter.load();

			expect(loaded).toBeNull();
		});

		it('should handle load errors gracefully', () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			// Store invalid JSON
			localStorage.setItem('idlefinder_state', 'invalid json');

			const loaded = adapter.load();

			expect(loaded).toBeNull();
			expect(consoleErrorSpy).toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
		});

		it('should handle localStorage unavailable (SSR)', () => {
			delete (global as any).localStorage;
			delete (global as any).window;

			const loaded = adapter.load();

			expect(loaded).toBeNull();
		});
	});

	describe('getLastPlayed', () => {
		it('should return last played timestamp', () => {
			const state = createTestGameState();
			const now = Timestamp.now();
			adapter.save(state, now);

			const lastPlayed = adapter.getLastPlayed();

			expect(lastPlayed).not.toBeNull();
			expect(lastPlayed).toBeInstanceOf(Date);
			// Timestamp is stored as string and converted back, so allow reasonable difference
			// The conversion might round or have small precision differences
			if (lastPlayed) {
				const lastPlayedTime = lastPlayed.getTime();
				expect(isNaN(lastPlayedTime)).toBe(false); // Ensure valid timestamp
				if (!isNaN(lastPlayedTime)) {
					const diff = Math.abs(lastPlayedTime - now.value);
					expect(diff).toBeLessThan(5000); // Allow up to 5 seconds difference for serialization
				}
			}
		});

		it('should return null when no state exists', () => {
			const lastPlayed = adapter.getLastPlayed();

			expect(lastPlayed).toBeNull();
		});
	});

	describe('clear', () => {
		it('should clear saved state', () => {
			const state = createTestGameState();
			const now = Timestamp.now();
			adapter.save(state, now);

			adapter.clear();

			expect(localStorage.getItem('idlefinder_state')).toBeNull();
		});

		it('should handle clear errors gracefully', () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			
			// Mock localStorage.removeItem to throw
			vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
				throw new Error('Storage error');
			});

			adapter.clear();

			expect(consoleErrorSpy).toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
		});

		it('should handle localStorage unavailable (SSR)', () => {
			delete (global as any).localStorage;
			delete (global as any).window;

			// Should not throw
			adapter.clear();
		});
	});
});

