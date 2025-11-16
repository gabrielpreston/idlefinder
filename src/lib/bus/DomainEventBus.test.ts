/**
 * DomainEventBus Tests - Fast unit tests
 * Speed target: <100ms total
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DomainEventBus } from './DomainEventBus';
import type { DomainEvent } from './types';

describe('DomainEventBus', () => {
	let eventBus: DomainEventBus;

	beforeEach(() => {
		eventBus = new DomainEventBus();
	});

	describe('subscribe/unsubscribe', () => {
		it('should subscribe to events', () => {
			const handler = vi.fn();
			const unsubscribe = eventBus.subscribe('MissionStarted', handler);

			expect(unsubscribe).toBeDefined();
			expect(typeof unsubscribe).toBe('function');
		});

		it('should unsubscribe from events', async () => {
			const handler = vi.fn();
			const unsubscribe = eventBus.subscribe('MissionStarted', handler);

			unsubscribe();

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('publish', () => {
		it('should notify subscribers', async () => {
			const handler = vi.fn();
			eventBus.subscribe('MissionStarted', handler);

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(event.payload);
		});

		it('should notify multiple subscribers', async () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			const handler3 = vi.fn();

			eventBus.subscribe('MissionStarted', handler1);
			eventBus.subscribe('MissionStarted', handler2);
			eventBus.subscribe('MissionStarted', handler3);

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(handler3).toHaveBeenCalledTimes(1);
		});

		it('should isolate errors - one handler fails, others succeed', async () => {
			// Suppress console.error for this test (error logging is expected)
			const originalError = console.error;
			console.error = vi.fn();

			const handler1 = vi.fn().mockRejectedValue(new Error('Handler 1 error'));
			const handler2 = vi.fn();
			const handler3 = vi.fn();

			eventBus.subscribe('MissionStarted', handler1);
			eventBus.subscribe('MissionStarted', handler2);
			eventBus.subscribe('MissionStarted', handler3);

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			// Should not throw
			await eventBus.publish(event);

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(handler3).toHaveBeenCalledTimes(1);

			// Restore console.error
			console.error = originalError;
		});

		it('should support async handlers', async () => {
			const asyncHandler = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});

			eventBus.subscribe('MissionStarted', asyncHandler);

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			expect(asyncHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe('event ordering', () => {
		it('should publish events in order', async () => {
			const receivedEvents: DomainEvent['type'][] = [];

			eventBus.subscribe('MissionStarted', () => {
				receivedEvents.push('MissionStarted');
			});
			eventBus.subscribe('MissionCompleted', () => {
				receivedEvents.push('MissionCompleted');
			});

			const event1: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: [],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			const event2: DomainEvent = {
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

			await eventBus.publish(event1);
			await eventBus.publish(event2);

			expect(receivedEvents).toEqual(['MissionStarted', 'MissionCompleted']);
		});
	});
});

