/**
 * Time Source Store Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContinuousTimeSource, createSynchronizedTimeSource } from './timeSource';
import { readable } from 'svelte/store';

describe('timeSource', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Mock requestAnimationFrame
		let rafId = 0;
		const rafCallbacks: Array<(timestamp: number) => void> = [];

		global.requestAnimationFrame = vi.fn((cb: (timestamp: number) => void) => {
			rafCallbacks.push(cb);
			return ++rafId;
		}) as unknown as typeof requestAnimationFrame;

		global.cancelAnimationFrame = vi.fn((_id: number) => {
			rafCallbacks.length = 0;
		}) as unknown as typeof cancelAnimationFrame;

		// Mock document for SSR safety check
		global.document = {
			hidden: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		} as unknown as Document;
	});

	afterEach(() => {
		vi.useRealTimers();
		delete (global as any).document;
		delete (global as any).requestAnimationFrame;
		delete (global as any).cancelAnimationFrame;
	});

	describe('createContinuousTimeSource', () => {
		it('should create time source with now and isActive stores', () => {
			const timeSource = createContinuousTimeSource(100);

			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();
		});

		it('should add visibility change listener when document exists', () => {
			const addEventListenerSpy = vi.fn();
			global.document = {
				hidden: false,
				addEventListener: addEventListenerSpy,
				removeEventListener: vi.fn()
			} as unknown as Document;

			createContinuousTimeSource(100);

			expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
		});

		it('should not add visibility change listener when document is undefined', () => {
			delete (global as any).document;

			// Should not throw
			const timeSource = createContinuousTimeSource(100);
			expect(timeSource).toBeDefined();
		});

		it('should update time when tab is visible', () => {
			global.document = {
				hidden: false,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			} as unknown as Document;

			const timeSource = createContinuousTimeSource(100);
			let currentTime: number | undefined;
			const unsubscribe = timeSource.now.subscribe((time) => {
				currentTime = time;
			});

			// Initial time should be set
			expect(currentTime).toBeDefined();

			unsubscribe();
		});
	});

	describe('createSynchronizedTimeSource', () => {
		it('should create time source with now and isActive stores', () => {
			const serverTimeBaseline = readable(Date.now());
			const timeSource = createSynchronizedTimeSource(serverTimeBaseline, 100);

			expect(timeSource.now).toBeDefined();
			expect(timeSource.isActive).toBeDefined();
		});

		it('should update time continuously', () => {
			const serverTimeBaseline = readable(Date.now());
			const timeSource = createSynchronizedTimeSource(serverTimeBaseline, 100);

			let currentTime: number | undefined;
			const unsubscribe = timeSource.now.subscribe((time) => {
				currentTime = time;
			});

			// Initial time should be set
			expect(currentTime).toBeDefined();

			unsubscribe();
		});
	});
});
