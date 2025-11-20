/**
 * VisualTick Store Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startVisualTick } from './visualTick';

describe('visualTick', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Mock requestAnimationFrame - don't call immediately to avoid infinite loop
		// Instead, track callbacks and call them manually when needed
		let rafId = 0;
		const pendingCallbacks: Array<(timestamp: number) => void> = [];
		global.requestAnimationFrame = vi.fn((cb) => {
			// Don't call immediately - store for manual execution
			pendingCallbacks.push(cb);
			return ++rafId;
		}) as unknown as typeof requestAnimationFrame;
		global.cancelAnimationFrame = vi.fn((_id: number) => {
			// Clear pending callbacks when cancelled
			pendingCallbacks.length = 0;
		}) as unknown as typeof cancelAnimationFrame;
		
		// Helper to manually trigger RAF callbacks
		 
		(global as any).__triggerRAF = () => {
			const callbacks = [...pendingCallbacks];
			pendingCallbacks.length = 0;
			callbacks.forEach(cb => cb(Date.now()));
		};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('startVisualTick', () => {
		it('should start visual tick loop', () => {
			const updateFn = vi.fn();
			const cleanup = startVisualTick(updateFn, 100);

			expect(updateFn).not.toHaveBeenCalled();
			expect(global.requestAnimationFrame).toHaveBeenCalled();

			cleanup();
		});

		it('should call update function after interval', () => {
			const updateFn = vi.fn();
			const cleanup = startVisualTick(updateFn, 100);

			// Trigger RAF callbacks and advance time past interval
			(global as any).__triggerRAF();
			vi.advanceTimersByTime(120);
			(global as any).__triggerRAF();

			// Function should have been called at least once
			expect(updateFn).toHaveBeenCalled();
			cleanup();
		});

		it('should throttle updates to interval', () => {
			const updateFn = vi.fn();
			const cleanup = startVisualTick(updateFn, 100);

			// Trigger RAF and advance time by less than interval
			(global as any).__triggerRAF();
			vi.advanceTimersByTime(50);
			(global as any).__triggerRAF();

			// Should not have been called yet (throttled)
			expect(updateFn).not.toHaveBeenCalled();

			// Advance past interval and trigger RAF
			vi.advanceTimersByTime(60);
			(global as any).__triggerRAF();

			expect(updateFn).toHaveBeenCalled();
			cleanup();
		});

		it('should return cleanup function', () => {
			const updateFn = vi.fn();
			const cleanup = startVisualTick(updateFn, 100);

			expect(typeof cleanup).toBe('function');
			cleanup();
		});

		it('should stop tick loop on cleanup', () => {
			const updateFn = vi.fn();
			const cleanup = startVisualTick(updateFn, 100);

			cleanup();

			expect(global.cancelAnimationFrame).toHaveBeenCalled();
		});

		it('should use default interval of 100ms', () => {
			const updateFn = vi.fn();
			const cleanup = startVisualTick(updateFn);

			// Trigger RAF and advance time
			(global as any).__triggerRAF();
			vi.advanceTimersByTime(120);
			(global as any).__triggerRAF();

			expect(updateFn).toHaveBeenCalled();
			cleanup();
		});
	});
});

