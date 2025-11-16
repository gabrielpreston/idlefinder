/**
 * TickBus Tests - Fast unit tests with fake timers
 * Speed target: <150ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TickBus } from './TickBus';
import type { TickHandler } from './TickBus';

describe('TickBus', () => {
	let tickBus: TickBus;

	beforeEach(() => {
		vi.useFakeTimers();
		tickBus = new TickBus();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('subscribe/unsubscribe', () => {
		it('should subscribe to tick events', () => {
			const handler: TickHandler = vi.fn();
			const unsubscribe = tickBus.subscribe(handler);

			expect(unsubscribe).toBeDefined();
			expect(typeof unsubscribe).toBe('function');
		});

		it('should unsubscribe from tick events', () => {
			const handler: TickHandler = vi.fn();
			const unsubscribe = tickBus.subscribe(handler);

			unsubscribe();

			// Advance time - handler should not be called
			vi.advanceTimersByTime(1000);

			expect(handler).not.toHaveBeenCalled();
		});

		it('should start ticking when first handler subscribes', () => {
			const handler: TickHandler = vi.fn();
			tickBus.subscribe(handler);

			vi.advanceTimersByTime(1000);

			expect(handler).toHaveBeenCalled();
		});

		it('should stop ticking when last handler unsubscribes', () => {
			const handler1: TickHandler = vi.fn();
			const handler2: TickHandler = vi.fn();

			const unsubscribe1 = tickBus.subscribe(handler1);
			const unsubscribe2 = tickBus.subscribe(handler2);

			unsubscribe1();
			unsubscribe2();

			vi.advanceTimersByTime(1000);

			expect(handler1).not.toHaveBeenCalled();
			expect(handler2).not.toHaveBeenCalled();
		});
	});

	describe('tick emission', () => {
		it('should emit ticks at 1-second intervals', () => {
			const handler: TickHandler = vi.fn();
			tickBus.subscribe(handler);

			vi.advanceTimersByTime(1000);
			expect(handler).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(1000);
			expect(handler).toHaveBeenCalledTimes(2);

			vi.advanceTimersByTime(1000);
			expect(handler).toHaveBeenCalledTimes(3);
		});

		it('should call handler with deltaMs and timestamp', () => {
			const handler = vi.fn<TickHandler>();
			tickBus.subscribe(handler);

			vi.advanceTimersByTime(1000);

			expect(handler).toHaveBeenCalledTimes(1);
			const call = handler.mock.calls[0];
			expect(call[0]).toBe(1000); // deltaMs
			expect(call[1]).toBeInstanceOf(Date); // timestamp
		});

		it('should notify multiple handlers', () => {
			const handler1: TickHandler = vi.fn();
			const handler2: TickHandler = vi.fn();
			const handler3: TickHandler = vi.fn();

			tickBus.subscribe(handler1);
			tickBus.subscribe(handler2);
			tickBus.subscribe(handler3);

			vi.advanceTimersByTime(1000);

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(handler3).toHaveBeenCalledTimes(1);
		});
	});

	describe('tick replay for offline catch-up', () => {
		it('should replay ticks for elapsed time', async () => {
			const handler: TickHandler = vi.fn();
			tickBus.subscribe(handler);

			// Replay 5 seconds (5 ticks)
			await tickBus.replayTicks(5000);

			expect(handler).toHaveBeenCalledTimes(5);
		});

		it('should handle remainder in tick replay', async () => {
			const handler: TickHandler = vi.fn();
			tickBus.subscribe(handler);

			// Replay 3.5 seconds (3 full ticks + 0.5s remainder)
			await tickBus.replayTicks(3500);

			expect(handler).toHaveBeenCalledTimes(4); // 3 full + 1 remainder
		});

		it('should use correct deltaMs in replay', async () => {
			const handler = vi.fn<TickHandler>();
			tickBus.subscribe(handler);

			await tickBus.replayTicks(5000, 1000);

			// First 5 calls should be 1000ms each
			for (let i = 0; i < 5; i++) {
				expect(handler.mock.calls[i][0]).toBe(1000);
			}
		});

		it('should handle async handlers in replay', async () => {
			const handler = vi.fn<TickHandler>().mockImplementation(async () => {
				await Promise.resolve();
			});
			tickBus.subscribe(handler);

			await tickBus.replayTicks(2000);

			expect(handler).toHaveBeenCalledTimes(2);
		});
	});
});

