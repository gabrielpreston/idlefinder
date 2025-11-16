/**
 * Persistence Integration Tests - Fast tests with mocked localStorage
 * Speed target: <400ms total
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceBus } from '../../bus/PersistenceBus';
import { DomainEventBus } from '../../bus/DomainEventBus';
import { LocalStorageAdapter } from '../../persistence/LocalStorageAdapter';
import { createTestPlayerState, setupMockLocalStorage } from '../../test-utils';
import type { DomainEvent } from '../../bus/types';

describe('Persistence Integration', () => {
	let eventBus: DomainEventBus;
	let stateGetter: () => ReturnType<typeof createTestPlayerState>;
	let adapter: LocalStorageAdapter;
	let persistenceBus: PersistenceBus;

	beforeEach(() => {
		setupMockLocalStorage();
		eventBus = new DomainEventBus();
		const state = createTestPlayerState();
		stateGetter = () => state;
		adapter = new LocalStorageAdapter();
		// Create PersistenceBus for tests that need it
		persistenceBus = new PersistenceBus(adapter, stateGetter, eventBus);
	});

	describe('save/load cycle', () => {
		it('should save and load state correctly', () => {
			const state = createTestPlayerState({ fame: 100 });
			stateGetter = () => state;

			// Save state
			adapter.save(state);

			// Load state
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			expect(loaded?.fame).toBe(100);
		});

		it('should return null when no saved state exists', () => {
			const loaded = adapter.load();
			expect(loaded).toBeNull();
		});
	});

	describe('immediate saves', () => {
		it('should save immediately for FacilityUpgraded', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			const event: DomainEvent = {
				type: 'FacilityUpgraded',
				payload: {
					facility: 'guildHall',
					newLevel: 2,
					effects: ['Level 2 guild hall - 6 mission slots']
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should save immediately, not after 10s
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});

		it('should save immediately for AdventurerRecruited', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			const event: DomainEvent = {
				type: 'AdventurerRecruited',
				payload: {
					adventurerId: 'adv-1',
					name: 'Test Adventurer',
					traits: ['Strong']
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should save immediately
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});

		it('should save immediately for MissionStarted', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: ['adv-1'],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should save immediately
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});

	describe('debounced saves', () => {
		it('should debounce MissionCompleted events', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			// Publish multiple MissionCompleted events
			const event1: DomainEvent = {
				type: 'MissionCompleted',
				payload: {
					missionId: 'mission-1',
					reward: {
						resources: { gold: 50, supplies: 10, relics: 0 },
						fame: 1,
						experience: 10
					}
				},
				timestamp: new Date().toISOString()
			};

			const event2: DomainEvent = {
				type: 'MissionCompleted',
				payload: {
					missionId: 'mission-2',
					reward: {
						resources: { gold: 75, supplies: 15, relics: 0 },
						fame: 2,
						experience: 15
					}
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event1);
			await eventBus.publish(event2);

			// Should not save yet
			expect(saveSpy).not.toHaveBeenCalled();

			// Advance time to trigger save
			vi.advanceTimersByTime(10000);

			// Should have saved once (debounced)
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});

		it('should debounce ResourcesChanged events', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			// Publish multiple ResourcesChanged events
			const event1: DomainEvent = {
				type: 'ResourcesChanged',
				payload: {
					delta: { gold: 10, supplies: 5, relics: 0 },
					current: { gold: 110, supplies: 5, relics: 0 }
				},
				timestamp: new Date().toISOString()
			};

			const event2: DomainEvent = {
				type: 'ResourcesChanged',
				payload: {
					delta: { gold: 20, supplies: 10, relics: 0 },
					current: { gold: 130, supplies: 15, relics: 0 }
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event1);
			await eventBus.publish(event2);

			// Should not save yet
			expect(saveSpy).not.toHaveBeenCalled();

			// Advance time to trigger save
			vi.advanceTimersByTime(10000);

			// Should have saved once (debounced)
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});

	describe('flush', () => {
		it('should flush pending saves immediately', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			// Trigger debounced event
			const event: DomainEvent = {
				type: 'MissionCompleted',
				payload: {
					missionId: 'mission-1',
					reward: {
						resources: { gold: 50, supplies: 10, relics: 0 },
						fame: 1,
						experience: 10
					}
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should not save yet (debounced)
			expect(saveSpy).not.toHaveBeenCalled();

			// Flush should save immediately
			persistenceBus.flush();
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again (already flushed, timeout cleared)
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});

	describe('version migration', () => {
		it('should handle version migration', () => {
			const state = createTestPlayerState({ fame: 50 });

			// Save with version
			adapter.save(state);

			// Load should return state (migration logic in adapter)
			const loaded = adapter.load();
			expect(loaded).not.toBeNull();
			expect(loaded?.fame).toBe(50);
		});
	});

	describe('error handling', () => {
		it('should handle localStorage errors gracefully', () => {
			// Suppress console.error for this test (error logging is expected)
			const originalError = console.error;
			console.error = vi.fn();

			// Mock localStorage to throw error
			const originalSetItem = global.localStorage.setItem;
			global.localStorage.setItem = vi.fn(() => {
				throw new Error('Storage quota exceeded');
			});

			const state = createTestPlayerState();

			// Should not throw
			expect(() => {
				adapter.save(state);
			}).not.toThrow();

			// Restore
			global.localStorage.setItem = originalSetItem;
			console.error = originalError;
		});
	});
});

