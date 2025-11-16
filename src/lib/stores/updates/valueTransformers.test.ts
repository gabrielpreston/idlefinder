/**
 * Value Transformers Tests - Fast unit tests for pure functions
 * Speed target: <100ms total
 */

import { describe, it, expect } from 'vitest';
import { writable, get } from 'svelte/store';
import {
	formatNumber,
	toPercentage,
	formatTimeRemaining,
	clamp
} from './valueTransformers';

describe('valueTransformers', () => {
	describe('formatNumber', () => {
		it('should format number with default locale', () => {
			const source = writable(1234.56);
			const formatted = formatNumber(source);

			expect(get(formatted)).toBe('1,234.56');
		});

		it('should format number with custom locale', () => {
			const source = writable(1234.56);
			const formatted = formatNumber(source, { locale: 'de-DE' });

			expect(get(formatted)).toBe('1.234,56');
		});

		it('should format number with unit', () => {
			const source = writable(100);
			const formatted = formatNumber(source, { unit: 'gold' });

			expect(get(formatted)).toBe('100 gold');
		});

		it('should format number with fraction digits', () => {
			const source = writable(1234.5);
			const formatted = formatNumber(source, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});

			expect(get(formatted)).toBe('1,234.50');
		});

		it('should format number without grouping', () => {
			const source = writable(1234);
			const formatted = formatNumber(source, { useGrouping: false });

			expect(get(formatted)).toBe('1234');
		});

		it('should handle zero', () => {
			const source = writable(0);
			const formatted = formatNumber(source);

			expect(get(formatted)).toBe('0');
		});

		it('should handle negative numbers', () => {
			const source = writable(-1234.56);
			const formatted = formatNumber(source);

			expect(get(formatted)).toBe('-1,234.56');
		});

		it('should update reactively when source changes', () => {
			const source = writable(100);
			const formatted = formatNumber(source);

			expect(get(formatted)).toBe('100');

			source.set(200);
			expect(get(formatted)).toBe('200');
		});
	});

	describe('toPercentage', () => {
		it('should convert 0 to 0%', () => {
			const source = writable(0);
			const percentage = toPercentage(source);

			expect(get(percentage)).toBe(0);
		});

		it('should convert 0.5 to 50%', () => {
			const source = writable(0.5);
			const percentage = toPercentage(source);

			expect(get(percentage)).toBe(50);
		});

		it('should convert 1 to 100%', () => {
			const source = writable(1);
			const percentage = toPercentage(source);

			expect(get(percentage)).toBe(100);
		});

		it('should round fractional percentages', () => {
			const source = writable(0.333);
			const percentage = toPercentage(source);

			expect(get(percentage)).toBe(33);
		});

		it('should handle values above 1', () => {
			const source = writable(1.5);
			const percentage = toPercentage(source);

			expect(get(percentage)).toBe(150);
		});

		it('should handle negative values', () => {
			const source = writable(-0.5);
			const percentage = toPercentage(source);

			expect(get(percentage)).toBe(-50);
		});
	});

	describe('formatTimeRemaining', () => {
		it('should format seconds (< 60s)', () => {
			const source = writable(30000); // 30 seconds
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('30s');
		});

		it('should format minutes (< 60m)', () => {
			const source = writable(120000); // 2 minutes
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('2m');
		});

		it('should format minutes and seconds', () => {
			const source = writable(150000); // 2m 30s
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('2m 30s');
		});

		it('should format hours', () => {
			const source = writable(3600000); // 1 hour
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('1h');
		});

		it('should format hours and minutes', () => {
			const source = writable(5400000); // 1h 30m
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('1h 30m');
		});

		it('should handle zero', () => {
			const source = writable(0);
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('0s');
		});

		it('should handle negative values', () => {
			const source = writable(-5000);
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('-5s');
		});

		it('should round down seconds', () => {
			const source = writable(59999); // 59.999 seconds
			const formatted = formatTimeRemaining(source);

			expect(get(formatted)).toBe('59s');
		});
	});

	describe('clamp', () => {
		it('should return value within bounds', () => {
			const source = writable(50);
			const clamped = clamp(source, 0, 100);

			expect(get(clamped)).toBe(50);
		});

		it('should clamp value below minimum', () => {
			const source = writable(-10);
			const clamped = clamp(source, 0, 100);

			expect(get(clamped)).toBe(0);
		});

		it('should clamp value above maximum', () => {
			const source = writable(150);
			const clamped = clamp(source, 0, 100);

			expect(get(clamped)).toBe(100);
		});

		it('should handle value at minimum', () => {
			const source = writable(0);
			const clamped = clamp(source, 0, 100);

			expect(get(clamped)).toBe(0);
		});

		it('should handle value at maximum', () => {
			const source = writable(100);
			const clamped = clamp(source, 0, 100);

			expect(get(clamped)).toBe(100);
		});

		it('should update reactively when source changes', () => {
			const source = writable(50);
			const clamped = clamp(source, 0, 100);

			expect(get(clamped)).toBe(50);

			source.set(150);
			expect(get(clamped)).toBe(100);

			source.set(-10);
			expect(get(clamped)).toBe(0);
		});

		it('should handle negative bounds', () => {
			const source = writable(-50);
			const clamped = clamp(source, -100, -10);

			expect(get(clamped)).toBe(-50);
		});
	});
});

