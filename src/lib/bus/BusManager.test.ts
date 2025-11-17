/**
 * BusManager Tests - Fast unit tests with mocked persistence
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BusManager } from './BusManager';
import { createTestGameState, setupMockLocalStorage } from '../test-utils';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';

describe('BusManager', () => {
	const testTimeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));

	beforeEach(() => {
		// Setup mock localStorage for node environment
		setupMockLocalStorage();
	});

	describe('constructor', () => {
		it('should create BusManager instance', () => {
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			expect(manager).toBeInstanceOf(BusManager);
		});
	});

	describe('bus wiring', () => {
		it('should have all buses accessible', () => {
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			expect(manager.commandBus).toBeDefined();
			expect(manager.domainEventBus).toBeDefined();
			expect(manager.tickBus).toBeDefined();
			expect(manager.persistenceBus).toBeDefined();
		});

		it('should have buses wired correctly', () => {
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			// CommandBus should use DomainEventBus
			expect(manager.commandBus).toBeDefined();
			expect(manager.domainEventBus).toBeDefined();

			// Buses should be separate instances
			expect(manager.commandBus).not.toBe(manager.domainEventBus);
		});
	});

	describe('state management', () => {
		it('should initialize with provided state', async () => {
			const { ResourceUnit } = await import('../domain/valueObjects/ResourceUnit');
			const { ResourceBundle } = await import('../domain/valueObjects/ResourceBundle');
			const baseResources = createTestGameState().resources;
			const fameBundle = ResourceBundle.fromArray([new ResourceUnit('fame', 100)]);
			const resources = baseResources.add(fameBundle);
			const initialState = createTestGameState({ resources });
			const manager = new BusManager(initialState, testTimeSource);

			const state = manager.getState();

			expect(state.resources.get('fame')).toBe(100);
		});

		it('should update state with setState', async () => {
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			const { ResourceUnit } = await import('../domain/valueObjects/ResourceUnit');
			const { ResourceBundle } = await import('../domain/valueObjects/ResourceBundle');
			const baseResources = createTestGameState().resources;
			const fameBundle = ResourceBundle.fromArray([new ResourceUnit('fame', 50)]);
			const resources = baseResources.add(fameBundle);
			const newState = createTestGameState({ resources });
			manager.setState(newState);

			expect(manager.getState().resources.get('fame')).toBe(50);
		});
	});

	describe('offline catch-up', () => {
		it('should load saved state on initialize', async () => {
			const { ResourceUnit } = await import('../domain/valueObjects/ResourceUnit');
			const { ResourceBundle } = await import('../domain/valueObjects/ResourceBundle');
			const baseResources1 = createTestGameState().resources;
			const fameBundle1 = ResourceBundle.fromArray([new ResourceUnit('fame', 200)]);
			const resources1 = baseResources1.add(fameBundle1);
			const savedState = createTestGameState({ resources: resources1 });
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			// Mock persistence bus to return saved state
			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(savedState);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(null);

			await manager.initialize();

			expect(manager.getState().resources.get('fame')).toBe(200);
		});

		it('should handle offline catch-up with tick replay', async () => {
			vi.useFakeTimers();
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			const lastPlayed = new Date(Date.now() - 5000); // 5 seconds ago
			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(null);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(lastPlayed);

			const tickHandler = vi.fn();
			manager.tickBus.subscribe(tickHandler);

			await manager.initialize();

			// Should have replayed ticks for elapsed time (5 seconds = 5 ticks)
			// Using fake timers prevents normal tick interval from firing
			expect(tickHandler).toHaveBeenCalledTimes(5);
			
			vi.useRealTimers();
		});

		it('should not replay ticks if no elapsed time', async () => {
			const initialState = createTestGameState();
			const manager = new BusManager(initialState, testTimeSource);

			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(null);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(null);

			const tickHandler = vi.fn();
			manager.tickBus.subscribe(tickHandler);

			await manager.initialize();

			// Should not replay if no lastPlayed
			expect(tickHandler).not.toHaveBeenCalled();
		});
	});
});

