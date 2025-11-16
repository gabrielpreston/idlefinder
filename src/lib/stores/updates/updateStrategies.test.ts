/**
 * Update Strategies Tests - Fast unit tests with mock stores
 * Speed target: <150ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writable, get } from 'svelte/store';
import {
	eventDriven,
	continuousInterpolation,
	throttledContinuous,
	type DurationConfig
} from './updateStrategies';
import { createContinuousTimeSource } from '../time/timeSource';

// Mock requestAnimationFrame for Node environment
beforeEach(() => {
	global.requestAnimationFrame = vi.fn((cb) => {
		setTimeout(cb, 16); // ~60fps
		return 1;
	}) as unknown as typeof requestAnimationFrame;

	global.cancelAnimationFrame = vi.fn() as unknown as typeof cancelAnimationFrame;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('updateStrategies', () => {
	describe('eventDriven', () => {
		it('should pass through source store unchanged', () => {
			const source = writable(100);
			const result = eventDriven(source);

			expect(get(result)).toBe(100);
		});

		it('should update when source changes', () => {
			const source = writable(100);
			const result = eventDriven(source);

			source.set(200);
			expect(get(result)).toBe(200);
		});

		it('should work with any type', () => {
			const source = writable('test');
			const result = eventDriven(source);

			expect(get(result)).toBe('test');
		});
	});

	describe('continuousInterpolation', () => {
		let timeSource: ReturnType<typeof createContinuousTimeSource>;
		let mockNow: number;
		let cleanup: (() => void) | undefined;

		beforeEach(() => {
			mockNow = Date.now();
			vi.useFakeTimers();
			vi.setSystemTime(mockNow);
			timeSource = createContinuousTimeSource(100);
		});

		afterEach(() => {
			if (cleanup) {
				cleanup();
				cleanup = undefined;
			}
			vi.useRealTimers();
		});

		it('should calculate progress at start (0%)', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: 1000
			});
			const progress = continuousInterpolation(config, timeSource);

			// Wait for initial subscription
			await vi.runAllTimersAsync();
			expect(get(progress)).toBeCloseTo(0, 1);
		});

		it('should calculate progress at midpoint (50%)', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 500,
				duration: 1000
			});
			const progress = continuousInterpolation(config, timeSource);

			// Advance time to trigger update
			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress)).toBeCloseTo(0.5, 1);
		});

		it('should calculate progress at completion (100%)', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 1000,
				duration: 1000
			});
			const progress = continuousInterpolation(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress)).toBeCloseTo(1, 1);
		});

		it('should clamp progress to 1 when past completion', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 2000,
				duration: 1000
			});
			const progress = continuousInterpolation(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress)).toBe(1);
		});

		it('should clamp progress to 0 when before start', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow + 1000,
				duration: 1000
			});
			const progress = continuousInterpolation(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress)).toBe(0);
		});

		it('should handle zero duration', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: 0
			});
			const progress = continuousInterpolation(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			// Zero duration results in division by zero (Infinity), which gets clamped
			const value = get(progress);
			// Clamp handles Infinity/NaN by converting to valid range
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
			expect(Number.isFinite(value)).toBe(true);
		});

		it('should update reactively when config changes', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: 1000
			});
			const progress = continuousInterpolation(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();
			expect(get(progress)).toBeCloseTo(0, 1);

			// Change config to already completed
			config.set({
				startTime: mockNow - 2000,
				duration: 1000
			});

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();
			expect(get(progress)).toBeCloseTo(1, 1);
		});

		it('should handle negative duration', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: -1000
			});
			const progress = continuousInterpolation(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			// Should clamp to valid range
			const value = get(progress);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
		});
	});

	describe('throttledContinuous', () => {
		it('should pass through source store', () => {
			const source = writable(100);
			const timeSource = createContinuousTimeSource(100);
			const result = throttledContinuous(source, timeSource, 50);

			expect(get(result)).toBe(100);
		});

		it('should update when source changes', () => {
			const source = writable(100);
			const timeSource = createContinuousTimeSource(100);
			const result = throttledContinuous(source, timeSource, 50);

			source.set(200);
			expect(get(result)).toBe(200);
		});
	});
});

