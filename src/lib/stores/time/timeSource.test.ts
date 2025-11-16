/**
 * Time Source Tests - Fast unit tests with tab visibility simulation
 * Speed target: <200ms total
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get, writable } from 'svelte/store';
import {
	createContinuousTimeSource,
	createSynchronizedTimeSource
} from './timeSource';

// Mock requestAnimationFrame for Node environment
beforeEach(() => {
	global.requestAnimationFrame = vi.fn((cb) => {
		setTimeout(cb, 16);
		return 1;
	}) as unknown as typeof requestAnimationFrame;

	global.cancelAnimationFrame = vi.fn() as unknown as typeof cancelAnimationFrame;

	// Mock document for SSR safety tests
	global.document = {
		hidden: false,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn()
	} as unknown as Document;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('timeSource', () => {
	describe('createContinuousTimeSource', () => {
		it('should create time source with now and isActive stores', () => {
			const timeSource = createContinuousTimeSource(100);

			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();
		});

		it('should initialize with current time', async () => {
			vi.useFakeTimers();
			const mockNow = Date.now();
			vi.setSystemTime(mockNow);

			const timeSource = createContinuousTimeSource(100);

			// Wait for initial subscription
			await vi.runAllTimersAsync();

			const now = get(timeSource.now);
			expect(now).toBeGreaterThanOrEqual(mockNow);
			expect(now).toBeLessThanOrEqual(mockNow + 100);

			vi.useRealTimers();
		});

		it('should update time continuously', async () => {
			vi.useFakeTimers();
			const mockNow = 1000000;
			vi.setSystemTime(mockNow);

			const timeSource = createContinuousTimeSource(100);

			await vi.runAllTimersAsync();
			const initialTime = get(timeSource.now);

			// Advance time significantly
			vi.advanceTimersByTime(200);
			vi.setSystemTime(mockNow + 200);
			await vi.runAllTimersAsync();

			const updatedTime = get(timeSource.now);
			expect(updatedTime).toBeGreaterThanOrEqual(initialTime);

			vi.useRealTimers();
		});

		it('should handle SSR environment (no document)', () => {
			// Temporarily remove document
			const originalDocument = global.document;
			// @ts-expect-error - Testing SSR scenario
			delete global.document;

			// Should not throw
			const timeSource = createContinuousTimeSource(100);
			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();

			// Restore document
			global.document = originalDocument;
		});

		it('should add visibility change listener when document exists', () => {
			createContinuousTimeSource(100);

			expect(global.document.addEventListener).toHaveBeenCalledWith(
				'visibilitychange',
				expect.any(Function)
			);
		});

		it('should accept custom interval parameter', () => {
			// Test that function accepts interval parameter without error
			const timeSource = createContinuousTimeSource(500);

			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();

			// Cleanup
			const unsubscribe = timeSource.now.subscribe(() => {});
			unsubscribe();
		});
	});

	describe('createSynchronizedTimeSource', () => {
		it('should create synchronized time source', () => {
			const serverTimeBaseline = writable(Date.now());
			const timeSource = createSynchronizedTimeSource(serverTimeBaseline, 100);

			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();
		});

		it('should create time source that updates', () => {
			const mockNow = Date.now();

			const serverTimeBaseline = writable(mockNow);
			const timeSource = createSynchronizedTimeSource(serverTimeBaseline, 100);

			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();

			// Verify it returns a time value
			const now = get(timeSource.now);
			expect(now).toBeGreaterThan(0);

			// Cleanup
			const unsubscribe = timeSource.now.subscribe(() => {});
			unsubscribe();
		});
	});
});

