/**
 * BusManager Tests - Fast unit tests with mocked persistence
 * Speed target: <300ms total
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BusManager } from './BusManager';
import { createTestPlayerState, setupMockLocalStorage } from '../test-utils';

describe('BusManager', () => {
	beforeEach(() => {
		// Setup mock localStorage for node environment
		setupMockLocalStorage();
	});

	describe('constructor', () => {
		it('should create BusManager instance', () => {
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

			expect(manager).toBeInstanceOf(BusManager);
		});
	});

	describe('bus wiring', () => {
		it('should have all buses accessible', () => {
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

			expect(manager.commandBus).toBeDefined();
			expect(manager.domainEventBus).toBeDefined();
			expect(manager.tickBus).toBeDefined();
			expect(manager.persistenceBus).toBeDefined();
		});

		it('should have buses wired correctly', () => {
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

			// CommandBus should use DomainEventBus
			expect(manager.commandBus).toBeDefined();
			expect(manager.domainEventBus).toBeDefined();

			// Buses should be separate instances
			expect(manager.commandBus).not.toBe(manager.domainEventBus);
		});
	});

	describe('state management', () => {
		it('should initialize with provided state', () => {
			const initialState = createTestPlayerState({ fame: 100 });
			const manager = new BusManager(initialState);

			const state = manager.getState();

			expect(state.fame).toBe(100);
		});

		it('should update state with setState', () => {
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

			const newState = createTestPlayerState({ fame: 50 });
			manager.setState(newState);

			expect(manager.getState().fame).toBe(50);
		});
	});

	describe('offline catch-up', () => {
		it('should load saved state on initialize', async () => {
			const savedState = createTestPlayerState({ fame: 200 });
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

			// Mock persistence bus to return saved state
			vi.spyOn(manager.persistenceBus, 'load').mockReturnValue(savedState);
			vi.spyOn(manager.persistenceBus, 'getLastPlayed').mockReturnValue(null);

			await manager.initialize();

			expect(manager.getState().fame).toBe(200);
		});

		it('should handle offline catch-up with tick replay', async () => {
			vi.useFakeTimers();
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

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
			const initialState = createTestPlayerState();
			const manager = new BusManager(initialState);

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

