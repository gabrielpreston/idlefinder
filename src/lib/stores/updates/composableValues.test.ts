/**
 * Composable Values Tests - Integration tests for composed stores
 * Speed target: <200ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writable, get } from 'svelte/store';
import {
	createDurationProgressStore,
	createResourceStore
} from './composableValues';
import { createContinuousTimeSource } from '../time/timeSource';
import type { DurationConfig } from './updateStrategies';

// Mock requestAnimationFrame for Node environment
beforeEach(() => {
	global.requestAnimationFrame = vi.fn((cb) => {
		setTimeout(cb, 16);
		return 1;
	}) as unknown as typeof requestAnimationFrame;

	global.cancelAnimationFrame = vi.fn() as unknown as typeof cancelAnimationFrame;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('composableValues', () => {
	describe('createDurationProgressStore', () => {
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

		it('should create all progress stores', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			expect(progress.progress).toBeDefined();
			expect(progress.progressPercent).toBeDefined();
			expect(progress.remaining).toBeDefined();
			expect(progress.timeRemaining).toBeDefined();
			expect(progress.isComplete).toBeDefined();
			expect(progress.isNearComplete).toBeDefined();
		});

		it('should calculate progress correctly', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 500,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress.progress)).toBeCloseTo(0.5, 1);
			expect(get(progress.progressPercent)).toBeCloseTo(50, 0);
		});

		it('should calculate remaining time correctly', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 300,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			const remaining = get(progress.remaining);
			expect(remaining).toBeGreaterThan(0);
			expect(remaining).toBeLessThanOrEqual(1000);
		});

		it('should format time remaining correctly', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 300,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			const timeRemaining = get(progress.timeRemaining);
			expect(typeof timeRemaining).toBe('string');
			expect(timeRemaining).toMatch(/\d+[smh]/);
		});

		it('should mark as complete when progress >= 100%', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 2000,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress.isComplete)).toBe(true);
			expect(get(progress.progress)).toBe(1);
			expect(get(progress.progressPercent)).toBe(100);
		});

		it('should mark as near complete when progress >= 90%', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 950,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress.isNearComplete)).toBe(true);
			expect(get(progress.isComplete)).toBe(false);
		});

		it('should update reactively when config changes', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress.isComplete)).toBe(false);

			// Change to completed
			config.set({
				startTime: mockNow - 2000,
				duration: 1000
			});

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress.isComplete)).toBe(true);
		});

		it('should handle zero remaining time', async () => {
			const config = writable<DurationConfig>({
				startTime: mockNow - 1000,
				duration: 1000
			});
			const progress = createDurationProgressStore(config, timeSource);

			vi.advanceTimersByTime(200);
			await vi.runAllTimersAsync();

			expect(get(progress.remaining)).toBe(0);
			expect(get(progress.timeRemaining)).toBe('0s');
		});
	});

	describe('createResourceStore', () => {
		it('should create value and formatted stores', () => {
			const source = writable(100);
			const resource = createResourceStore(source);

			expect(resource.value).toBeDefined();
			expect(resource.formatted).toBeDefined();
		});

		it('should pass through source value', () => {
			const source = writable(100);
			const resource = createResourceStore(source);

			expect(get(resource.value)).toBe(100);
			expect(get(resource.formatted)).toBe(100);
		});

		it('should update reactively when source changes', () => {
			const source = writable(100);
			const resource = createResourceStore(source);

			source.set(200);

			expect(get(resource.value)).toBe(200);
			expect(get(resource.formatted)).toBe(200);
		});

		it('should accept optional unit parameter', () => {
			const source = writable(100);
			const resource = createResourceStore(source, 'gold');

			expect(get(resource.value)).toBe(100);
		});
	});
});

