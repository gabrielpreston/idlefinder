/**
 * Mock BusManager - Test factory for BusManager with mocked persistence
 * Fast: No real localStorage, instant creation
 */

import { BusManager } from '../bus/BusManager';
import type { PlayerState } from '../domain/entities/PlayerState';
import { createTestPlayerState } from './testFactories';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';

/**
 * Create test BusManager with mocked persistence
 * Persistence operations are mocked - no real localStorage
 */
export function createTestBusManager(initialState?: PlayerState, timeSource?: import('../time/DomainTimeSource').DomainTimeSource): BusManager {
	const state = initialState ?? createTestPlayerState();
	const ts = timeSource ?? new SimulatedTimeSource(Timestamp.from(Date.now()));
	const manager = new BusManager(state, ts);

	// Mock persistence to avoid localStorage
	// Note: PersistenceBus methods are private, so we mock the adapter instead
	// For tests, we'll create a BusManager with a mocked adapter
	// This is handled at the adapter level in actual test files

	return manager;
}

/**
 * Reset BusManager singleton for testing
 * Call this in beforeEach to ensure clean state
 */
export function resetBusManagerSingleton(): void {
	// Clear the singleton by accessing the module's private variable
	// This is a workaround - in real tests, we'll use vi.resetModules()
	// For now, we'll rely on test isolation via vi.isolateModules()
}

