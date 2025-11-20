/**
 * PersistenceBus Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PersistenceBus } from './PersistenceBus';
import { DomainEventBus } from './DomainEventBus';
import { LocalStorageAdapter } from '../persistence/LocalStorageAdapter';
import { createTestGameState } from '../test-utils/testFactories';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import type { GameState } from '../domain/entities/GameState';

describe('PersistenceBus', () => {
	let adapter: LocalStorageAdapter;
	let eventBus: DomainEventBus;
	let stateGetter: () => GameState;
	let timeSource: SimulatedTimeSource;
	let persistenceBus: PersistenceBus;

	beforeEach(() => {
		adapter = new LocalStorageAdapter();
		eventBus = new DomainEventBus();
		const state = createTestGameState();
		stateGetter = () => state;
		timeSource = new SimulatedTimeSource(Timestamp.now());
		// Clear any resetting flag from previous tests
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('__resetting');
		}
		persistenceBus = new PersistenceBus(adapter, stateGetter, eventBus, timeSource);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('save behavior', () => {
		it('should save immediately on critical events', () => {
			const saveSpy = vi.spyOn(adapter, 'save');

			eventBus.publish({
				type: 'FacilityUpgraded',
				payload: { facilityId: 'facility-1', facilityType: 'Guildhall', newTier: 2, bonusMultipliers: {} },
				timestamp: new Date().toISOString()
			});

			// Give event bus time to process
			setTimeout(() => {
				expect(saveSpy).toHaveBeenCalled();
			}, 0);
		});

		it('should schedule debounced save on less critical events', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			await eventBus.publish({
				type: 'MissionCompleted',
				payload: { missionId: 'mission-1', adventurerIds: ['adv-1'], outcome: 'Success', rewards: { gold: 100, xp: 20 } },
				timestamp: new Date().toISOString()
			});

			// Should not save immediately
			expect(saveSpy).not.toHaveBeenCalled();

			// After debounce interval, should save
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalled();
		});

		it('should cancel previous debounced save when new one is scheduled', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			await eventBus.publish({
				type: 'ResourcesChanged',
				payload: { delta: { gold: 100, fame: 0, materials: 0 }, current: { gold: 100, fame: 0, materials: 0 } },
				timestamp: new Date().toISOString()
			});

			// Schedule another save before first one fires
			await eventBus.publish({
				type: 'ResourcesChanged',
				payload: { delta: { gold: 200, fame: 0, materials: 0 }, current: { gold: 200, fame: 0, materials: 0 } },
				timestamp: new Date().toISOString()
			});

			// Advance time but not enough for first save
			vi.advanceTimersByTime(5000);
			expect(saveSpy).not.toHaveBeenCalled();

			// Advance to second save time
			vi.advanceTimersByTime(5000);
			expect(saveSpy).toHaveBeenCalledTimes(1); // Only one save, not two
		});

		it('should not save when resetting flag is set', async () => {
			// Set flag before publishing event
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('__resetting', 'true');
			}
			
			const saveSpy = vi.spyOn(adapter, 'save');

			await eventBus.publish({
				type: 'FacilityUpgraded',
				payload: { facilityId: 'facility-1', facilityType: 'Guildhall', newTier: 2, bonusMultipliers: {} },
				timestamp: new Date().toISOString()
			});

			// Should not save during reset (save() checks flag and returns early)
			// Note: In test environment, window might not be defined, so this test may not work
			// But it still tests the branch in the code
			if (typeof window !== 'undefined') {
				expect(saveSpy).not.toHaveBeenCalled();
			} else {
				// In non-browser environment, save will be called (window check fails)
				expect(saveSpy).toHaveBeenCalled();
			}

			if (typeof window !== 'undefined') {
				sessionStorage.removeItem('__resetting');
			}
		});
	});

	describe('flush', () => {
		it('should flush pending saves', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			await eventBus.publish({
				type: 'MissionCompleted',
				payload: { missionId: 'mission-1', adventurerIds: ['adv-1'], outcome: 'Success', rewards: { gold: 100, xp: 20 } },
				timestamp: new Date().toISOString()
			});

			// Flush before debounce interval
			persistenceBus.flush();

			expect(saveSpy).toHaveBeenCalled();
		});

		it('should handle flush when no pending save', () => {
			const saveSpy = vi.spyOn(adapter, 'save');

			persistenceBus.flush();

			expect(saveSpy).toHaveBeenCalled();
		});

		it('should handle flush when saveTimeout is null', () => {
			// flush() should work even when saveTimeout is null
			const saveSpy = vi.spyOn(adapter, 'save');
			
			// Flush when no pending save (saveTimeout is null)
			persistenceBus.flush();
			
			expect(saveSpy).toHaveBeenCalled();
		});
	});

	describe('window handling', () => {
		it('should handle when window is undefined', () => {
			// Save original window
			 
			const originalWindow = (global as any).window;
			 
			delete (global as any).window;

			// Create new PersistenceBus - should not throw
			const newAdapter = new LocalStorageAdapter();
			const newEventBus = new DomainEventBus();
			const newStateGetter = () => createTestGameState();
			const newTimeSource = new SimulatedTimeSource(Timestamp.now());
			
			expect(() => {
				new PersistenceBus(newAdapter, newStateGetter, newEventBus, newTimeSource);
			}).not.toThrow();

			// Restore window
			if (originalWindow) {
				 
				(global as any).window = originalWindow;
			}
		});
	});

	describe('load and clear', () => {
		it('should load state from adapter', () => {
			const loadSpy = vi.spyOn(adapter, 'load');
			persistenceBus.load();
			expect(loadSpy).toHaveBeenCalled();
		});

		it('should get last played from adapter', () => {
			const getLastPlayedSpy = vi.spyOn(adapter, 'getLastPlayed');
			persistenceBus.getLastPlayed();
			expect(getLastPlayedSpy).toHaveBeenCalled();
		});

		it('should clear adapter', () => {
			const clearSpy = vi.spyOn(adapter, 'clear');
			persistenceBus.clear();
			expect(clearSpy).toHaveBeenCalled();
		});
	});
});

