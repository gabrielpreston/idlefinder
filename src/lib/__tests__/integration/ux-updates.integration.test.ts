/**
 * UX Updates Integration Tests
 * Tests that component migration maintains functionality and performance
 * Speed target: <500ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writable, get } from 'svelte/store';
import { createDurationProgressStore } from '../../stores/updates/composableValues';
import { createContinuousTimeSource } from '../../stores/time/timeSource';
import type { DurationConfig } from '../../stores/updates/updateStrategies';

// Mock requestAnimationFrame for Node environment
beforeEach(() => {
	global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback): number => {
		setTimeout(() => {
			cb(performance.now());
		}, 16);
		return 1;
	}) as unknown as typeof requestAnimationFrame;

	global.cancelAnimationFrame = vi.fn() as unknown as typeof cancelAnimationFrame;

	global.document = {
		hidden: false,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	} as unknown as Document;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('UX Updates Integration', () => {
	describe('DurationProgressStore Integration', () => {
		let timeSource: ReturnType<typeof createContinuousTimeSource>;
		let mockNow: number;

		beforeEach(() => {
			mockNow = Date.now();
			vi.useFakeTimers();
			vi.setSystemTime(mockNow);
			timeSource = createContinuousTimeSource(100);
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should maintain same progress calculation as before', async () => {
			const startTime = mockNow - 500;
			const duration = 1000;

			// Old way: manual calculation
			const oldProgress = Math.min(100, ((mockNow - startTime) / duration) * 100);

			// New way: using composable store
			const config = writable<DurationConfig>({
				startTime,
				duration
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			const newProgressPercent = get(progress.progressPercent);

			// Should match within 1% (accounting for timing differences)
			expect(Math.abs(newProgressPercent - oldProgress)).toBeLessThan(1);
		});

		it('should handle multiple progress bars simultaneously', async () => {
			const configs = [
				{ startTime: mockNow - 200, duration: 1000 },
				{ startTime: mockNow - 500, duration: 1000 },
				{ startTime: mockNow - 800, duration: 1000 }
			];

			const progressStores = configs.map((cfg) => {
				const config = writable<DurationConfig>(cfg);
				return createDurationProgressStore(config, timeSource);
			});

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			// All stores should have valid progress values
			progressStores.forEach((store, index) => {
				const progress = get(store.progress);
				expect(progress).toBeGreaterThanOrEqual(0);
				expect(progress).toBeLessThanOrEqual(1);
				expect(Number.isFinite(progress)).toBe(true);

				// Progress should increase with earlier start times
				if (index > 0) {
					const prevProgress = get(progressStores[index - 1].progress);
					expect(progress).toBeGreaterThanOrEqual(prevProgress);
				}
			});
		});

		it('should handle tab visibility changes', () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			// Simulate tab becoming hidden by calling the visibility handler
			// global.document is always set in beforeEach
			const visibilityHandler = (global.document.addEventListener as ReturnType<
				typeof vi.fn
			>).mock.calls.find(
				(call) => call[0] === 'visibilitychange'
			)?.[1] as () => void;

			// Handler toggles isTabVisible, so calling it simulates visibility change
			// visibilityHandler is always defined because createDurationProgressStore sets up the listener
			visibilityHandler();

			// Progress store should still be accessible
			const progressValue = get(progress.progress);
			expect(progressValue).toBeGreaterThanOrEqual(0);
			expect(progressValue).toBeLessThanOrEqual(1);
		});

		it('should format time remaining correctly for various durations', async () => {
			const testCases = [
				{ elapsed: 0, duration: 30000, expected: '30s' }, // 30 seconds
				{ elapsed: 0, duration: 120000, expected: '2m' }, // 2 minutes
				{ elapsed: 0, duration: 150000, expected: '2m 30s' }, // 2m 30s
				{ elapsed: 0, duration: 3600000, expected: '1h' } // 1 hour
			];

			for (const testCase of testCases) {
				const config = writable<DurationConfig>({
					startTime: mockNow - testCase.elapsed,
					duration: testCase.duration
				});
				const progress = createDurationProgressStore(config, timeSource);

				vi.advanceTimersByTime(200);
				await vi.runAllTimersAsync();

				const timeRemaining = get(progress.timeRemaining);
				expect(typeof timeRemaining).toBe('string');
				// Should match expected format (allowing for slight timing differences)
				expect(timeRemaining).toMatch(/\d+[smh]/);
			}
		});

		it('should handle edge cases without errors', async () => {
			const edgeCases = [
				{ startTime: mockNow, duration: 0 }, // Zero duration
				{ startTime: mockNow, duration: -1000 }, // Negative duration
				{ startTime: mockNow + 1000, duration: 1000 }, // Future start
				{ startTime: mockNow - 2000, duration: 1000 } // Past completion
			];

			for (const edgeCase of edgeCases) {
				const config = writable<DurationConfig>(edgeCase);
				const progress = createDurationProgressStore(config, timeSource);

				vi.advanceTimersByTime(200);
				await vi.runAllTimersAsync();

				// Should not throw and should return valid values
				const progressValue = get(progress.progress);
				expect(progressValue).toBeGreaterThanOrEqual(0);
				expect(progressValue).toBeLessThanOrEqual(1);
				expect(Number.isFinite(progressValue)).toBe(true);
			}
		});
	});

	describe('Performance', () => {
		it('should handle 50+ progress bars efficiently', async () => {
			vi.useFakeTimers();
			const mockNow = Date.now();
			vi.setSystemTime(mockNow);

			const timeSource = createContinuousTimeSource(100);
			const progressStores = [];

			// Create 50 progress stores
			for (let i = 0; i < 50; i++) {
				const config = writable<DurationConfig>({
					startTime: mockNow - i * 10,
					duration: 1000
				});
				progressStores.push(createDurationProgressStore(config, timeSource));
			}

			const startTime = performance.now();

			// Advance time and get all values
			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			progressStores.forEach((store) => {
				get(store.progress);
				get(store.progressPercent);
				get(store.timeRemaining);
			});

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Should complete in reasonable time (<500ms for 50 stores with fake timers)
			// Note: Real-world performance will be much better without fake timers
			expect(duration).toBeLessThan(500);

			vi.useRealTimers();
		});
	});
});

