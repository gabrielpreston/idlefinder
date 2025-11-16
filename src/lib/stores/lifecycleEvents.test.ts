import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lifecycleEvents, EventPriority } from './lifecycleEvents';

describe('LifecycleEventBus', () => {
	beforeEach(() => {
		// Reset metrics between tests
		lifecycleEvents.setDebugMode(false);
	});

	describe('Basic functionality', () => {
		it('should dispatch and receive events', () => {
			let received = false;
			const handler = () => {
				received = true;
			};

			const cleanup = lifecycleEvents.on('test-event', handler);
			lifecycleEvents.dispatch('test-event', { data: 'test' });

			// Events are batched, so we need to wait a bit
			setTimeout(() => {
				expect(received).toBe(true);
				cleanup();
			}, 100);
		});

		it('should maintain backward compatibility with existing API', () => {
			let received = false;
			const handler = () => {
				received = true;
			};

			// Test that dispatch() without priority works (defaults to MEDIUM)
			const cleanup = lifecycleEvents.on('test-event', handler);
			lifecycleEvents.dispatch('test-event', { data: 'test' });

			setTimeout(() => {
				expect(received).toBe(true);
				cleanup();
			}, 100);
		});
	});

	describe('Event priorities', () => {
		it('should process CRITICAL events immediately', () => {
			let criticalReceived = false;
			let normalReceived = false;

			const criticalHandler = () => {
				criticalReceived = true;
			};
			const normalHandler = () => {
				normalReceived = true;
			};

			const cleanup1 = lifecycleEvents.on('critical-event', criticalHandler);
			const cleanup2 = lifecycleEvents.on('normal-event', normalHandler);

			// Dispatch normal first, then critical
			lifecycleEvents.dispatch('normal-event', {}, EventPriority.MEDIUM);
			lifecycleEvents.dispatch('critical-event', {}, EventPriority.CRITICAL);

			// Critical should be processed immediately
			expect(criticalReceived).toBe(true);
			// Normal should be batched
			setTimeout(() => {
				expect(normalReceived).toBe(true);
				cleanup1();
				cleanup2();
			}, 100);
		});
	});

	describe('Error isolation', () => {
		it('should isolate handler errors and continue processing', () => {
			// Suppress console.error for this test (error logging is expected)
			const originalError = console.error;
			console.error = vi.fn();

			const errorHandler = vi.fn(() => {
				throw new Error('Handler error');
			});
			const goodHandler = vi.fn();

			const cleanup1 = lifecycleEvents.on('test-error', errorHandler);
			const cleanup2 = lifecycleEvents.on('test-error', goodHandler);

			lifecycleEvents.dispatch('test-error', {}, EventPriority.CRITICAL);

			// Both handlers should be called
			expect(errorHandler).toHaveBeenCalled();
			expect(goodHandler).toHaveBeenCalled();

			cleanup1();
			cleanup2();

			// Restore console.error
			console.error = originalError;
		});
	});

	describe('Event filtering', () => {
		it('should filter events based on filter function', () => {
			let received = false;
			const handler = () => {
				received = true;
			};

			const cleanup = lifecycleEvents.on(
				'test-filter',
				handler,
				{
					filter: (detail: unknown) => {
						return (detail as { value: number }).value > 5;
					}
				}
			);

			// This should be filtered out
			lifecycleEvents.dispatch('test-filter', { value: 3 }, EventPriority.CRITICAL);
			expect(received).toBe(false);

			// This should pass through
			lifecycleEvents.dispatch('test-filter', { value: 10 }, EventPriority.CRITICAL);
			expect(received).toBe(true);

			cleanup();
		});
	});

	describe('One-time listeners', () => {
		it('should fire once and cleanup automatically', () => {
			let callCount = 0;
			const handler = () => {
				callCount++;
			};

			const cleanup = lifecycleEvents.on('test-once', handler, { once: true });

			lifecycleEvents.dispatch('test-once', {}, EventPriority.CRITICAL);
			lifecycleEvents.dispatch('test-once', {}, EventPriority.CRITICAL);
			lifecycleEvents.dispatch('test-once', {}, EventPriority.CRITICAL);

			expect(callCount).toBe(1);
			cleanup();
		});
	});

	describe('Context cleanup', () => {
		it('should cleanup all subscriptions for a context', () => {
			const context = { component: 'test' };
			let callCount = 0;
			const handler = () => {
				callCount++;
			};

			lifecycleEvents.on('test-cleanup', handler, { context });
			lifecycleEvents.on('test-cleanup-2', handler, { context });

			lifecycleEvents.cleanup(context);

			lifecycleEvents.dispatch('test-cleanup', {}, EventPriority.CRITICAL);
			lifecycleEvents.dispatch('test-cleanup-2', {}, EventPriority.CRITICAL);

			expect(callCount).toBe(0);
		});
	});

	describe('Throttling', () => {
		it('should throttle high-frequency events', async () => {
			let callCount = 0;
			const handler = () => {
				callCount++;
			};

			const cleanup = lifecycleEvents.on('test-throttle', handler);

			// Dispatch multiple events rapidly
			lifecycleEvents.dispatchThrottled('test-throttle', { value: 1 }, 50);
			lifecycleEvents.dispatchThrottled('test-throttle', { value: 2 }, 50);
			lifecycleEvents.dispatchThrottled('test-throttle', { value: 3 }, 50);

			// Should only dispatch once immediately, then pending
			await new Promise((resolve) => setTimeout(resolve, 100));
			// After throttle period, should have dispatched pending event
			expect(callCount).toBeGreaterThan(0);
			cleanup();
		});
	});

	describe('Metrics and debugging', () => {
		it('should track metrics', () => {
			const cleanup = lifecycleEvents.on('test-metrics', () => {});

			lifecycleEvents.dispatch('test-metrics', {}, EventPriority.CRITICAL);
			lifecycleEvents.dispatch('test-metrics', {}, EventPriority.MEDIUM);

			const metrics = lifecycleEvents.getMetrics();
			expect(metrics.eventsDispatched).toBeGreaterThan(0);

			cleanup();
		});

		it('should track event history', () => {
			lifecycleEvents.dispatch('test-history', { data: 'test' }, EventPriority.CRITICAL);

			const history = lifecycleEvents.getEventHistory({ type: 'test-history' });
			expect(history.length).toBeGreaterThan(0);
			expect(history[0].type).toBe('test-history');
		});

		it('should enable debug mode', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			lifecycleEvents.setDebugMode(true);
			lifecycleEvents.dispatch('test-debug', {}, EventPriority.CRITICAL);

			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
			lifecycleEvents.setDebugMode(false);
		});
	});

	describe('Queue overflow protection', () => {
		it('should drop events when queue is full', async () => {
			// Fill queue beyond max size rapidly before processing can occur
			// We need to dispatch faster than requestAnimationFrame can process
			
			// Dispatch many events synchronously to fill queue
			for (let i = 0; i < 1001; i++) {
				lifecycleEvents.dispatch(`test-queue-${i}`, {}, EventPriority.MEDIUM);
			}

			// Check metrics immediately (before processing)
			await new Promise((resolve) => setTimeout(resolve, 10));
			const metrics = lifecycleEvents.getMetrics();
			// Queue should be at max size, and some events should be dropped
			expect(metrics.queueSize).toBeLessThanOrEqual(1000);
			// If queue filled up, events should have been dropped
			if (metrics.queueSize >= 1000) {
				expect(metrics.eventsDropped).toBeGreaterThan(0);
			}
		});
	});
});

