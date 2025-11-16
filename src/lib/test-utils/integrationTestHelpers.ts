/**
 * Integration Test Helpers - Reusable setup/teardown utilities for integration tests
 * Fast: No real localStorage, instant creation
 */

import type { BusManager } from '../bus/BusManager';
import { BusManager as BusManagerImpl } from '../bus/BusManager';
import { registerHandlers } from '../handlers';
import { createTestPlayerState } from './testFactories';
import { setupMockLocalStorage } from './mockLocalStorage';
import { SimulatedTimeSource } from '../time/DomainTimeSource';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import type { DomainEvent, DomainEventType } from '../bus/types';
import type { PlayerState } from '../domain/entities/PlayerState';
import { vi } from 'vitest';

/**
 * Integration test context returned by setupIntegrationTest
 */
export interface IntegrationTestContext {
	busManager: BusManager;
	publishedEvents: DomainEvent[];
	testTimeSource: SimulatedTimeSource;
}

/**
 * Setup integration test environment
 * Creates BusManager, registers handlers, and sets up event subscriptions
 */
export function setupIntegrationTest(options?: {
	useFakeTimers?: boolean;
	initialState?: PlayerState;
	eventTypes?: DomainEventType[];
}): IntegrationTestContext {
	if (options?.useFakeTimers) {
		vi.useFakeTimers();
	}

	setupMockLocalStorage();

	const initialState = options?.initialState ?? createTestPlayerState();
	const testTimeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));
	const busManager = new BusManagerImpl(initialState, testTimeSource);
	registerHandlers(busManager);

	const publishedEvents: DomainEvent[] = [];
	const eventTypes = options?.eventTypes ?? [];

	for (const eventType of eventTypes) {
		busManager.domainEventBus.subscribe(eventType, (payload: DomainEvent['payload']) => {
			publishedEvents.push({
				type: eventType,
				payload: payload as DomainEvent['payload'],
				timestamp: new Date().toISOString()
			});
		});
	}

	return { busManager, publishedEvents, testTimeSource };
}

/**
 * Teardown integration test environment
 * Restores real timers if fake timers were used
 */
export function teardownIntegrationTest(useFakeTimers: boolean = false): void {
	if (useFakeTimers) {
		vi.useRealTimers();
	}
}

