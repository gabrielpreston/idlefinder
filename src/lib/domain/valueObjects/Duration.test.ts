import { describe, it, expect } from 'vitest';
import { Duration } from './Duration';
import { Timestamp } from './Timestamp';

describe('Duration', () => {
	describe('factory methods', () => {
		it('should create duration from seconds', () => {
			const duration = Duration.ofSeconds(5);
			expect(duration.toMilliseconds()).toBe(5000);
		});

		it('should create duration from minutes', () => {
			const duration = Duration.ofMinutes(2);
			expect(duration.toMilliseconds()).toBe(120000);
		});

		it('should create duration from hours', () => {
			const duration = Duration.ofHours(1);
			expect(duration.toMilliseconds()).toBe(3600000);
		});

		it('should create duration from days', () => {
			const duration = Duration.ofDays(1);
			expect(duration.toMilliseconds()).toBe(86400000);
		});
	});

	describe('between', () => {
		it('should compute duration between two timestamps', () => {
			const t1 = Timestamp.from(1000);
			const t2 = Timestamp.from(6000);
			const duration = Duration.between(t1, t2);
			expect(duration.toMilliseconds()).toBe(5000);
		});

		it('should compute absolute duration regardless of order', () => {
			const t1 = Timestamp.from(6000);
			const t2 = Timestamp.from(1000);
			const duration = Duration.between(t1, t2);
			expect(duration.toMilliseconds()).toBe(5000);
		});
	});

	describe('add', () => {
		it('should add durations and return new duration', () => {
			const d1 = Duration.ofSeconds(5);
			const d2 = Duration.ofSeconds(3);
			const result = d1.add(d2);

			expect(result.toMilliseconds()).toBe(8000);
			expect(result).not.toBe(d1); // Immutability check
		});
	});

	describe('subtract', () => {
		it('should subtract durations and return new duration', () => {
			const d1 = Duration.ofSeconds(10);
			const d2 = Duration.ofSeconds(3);
			const result = d1.subtract(d2);

			expect(result.toMilliseconds()).toBe(7000);
			expect(result).not.toBe(d1); // Immutability check
		});
	});

	describe('conversions', () => {
		it('should convert to milliseconds', () => {
			const duration = Duration.ofSeconds(5);
			expect(duration.toMilliseconds()).toBe(5000);
		});

		it('should convert to seconds', () => {
			const duration = Duration.ofSeconds(5);
			expect(duration.toSeconds()).toBe(5);
		});
	});

	describe('immutability', () => {
		it('should not mutate original duration when adding', () => {
			const original = Duration.ofSeconds(5);
			const originalMs = original.milliseconds;
			original.add(Duration.ofSeconds(3));
			expect(original.milliseconds).toBe(originalMs);
		});

		it('should not mutate original duration when subtracting', () => {
			const original = Duration.ofSeconds(10);
			const originalMs = original.milliseconds;
			original.subtract(Duration.ofSeconds(3));
			expect(original.milliseconds).toBe(originalMs);
		});
	});
});

