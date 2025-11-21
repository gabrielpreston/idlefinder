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
	clamp,
	formatInteger,
	formatDecimal
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

	describe('formatInteger', () => {
		it('should format whole number as integer', () => {
			expect(formatInteger(100)).toBe('100');
		});

		it('should round down fractional values', () => {
			expect(formatInteger(10.123)).toBe('10');
			expect(formatInteger(10.999)).toBe('10');
		});

		it('should format large numbers with grouping', () => {
			expect(formatInteger(1234567)).toBe('1,234,567');
		});

		it('should handle zero', () => {
			expect(formatInteger(0)).toBe('0');
		});

		it('should handle negative numbers (rounds down)', () => {
			expect(formatInteger(-1.5)).toBe('-2');
			expect(formatInteger(-10.9)).toBe('-11');
		});

		it('should handle negative whole numbers', () => {
			expect(formatInteger(-100)).toBe('-100');
		});
	});

	describe('formatDecimal', () => {
		it('should format number with 1 decimal place by default', () => {
			expect(formatDecimal(10.5)).toBe('10.5');
			expect(formatDecimal(10.123)).toBe('10.1');
		});

		it('should format number with specified decimal places', () => {
			expect(formatDecimal(10.123, 2)).toBe('10.12');
			expect(formatDecimal(10.1, 2)).toBe('10.10');
			expect(formatDecimal(10.123456, 3)).toBe('10.123');
		});

		it('should format whole numbers with decimal places', () => {
			expect(formatDecimal(10, 1)).toBe('10.0');
			expect(formatDecimal(100, 2)).toBe('100.00');
		});

		it('should format large numbers with grouping', () => {
			expect(formatDecimal(1234567.89, 1)).toBe('1,234,567.9');
		});

		it('should handle zero', () => {
			expect(formatDecimal(0, 1)).toBe('0.0');
			expect(formatDecimal(0, 2)).toBe('0.00');
		});

		it('should handle negative numbers', () => {
			expect(formatDecimal(-10.5, 1)).toBe('-10.5');
			expect(formatDecimal(-10.123, 2)).toBe('-10.12');
		});
	});
});

