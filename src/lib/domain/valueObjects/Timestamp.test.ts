import { describe, it, expect } from 'vitest';
import { Timestamp } from './Timestamp';
import { Duration } from './Duration';

describe('Timestamp', () => {
	describe('now', () => {
		it('should create timestamp for current time', () => {
			const before = Date.now();
			const timestamp = Timestamp.now();
			const after = Date.now();

			expect(timestamp.value).toBeGreaterThanOrEqual(before);
			expect(timestamp.value).toBeLessThanOrEqual(after);
		});
	});

	describe('from', () => {
		it('should create timestamp from number', () => {
			const value = 1234567890;
			const timestamp = Timestamp.from(value);
			expect(timestamp.value).toBe(value);
		});

		it('should create timestamp from Date object', () => {
			const date = new Date(1234567890);
			const timestamp = Timestamp.from(date);
			expect(timestamp.value).toBe(1234567890);
		});
	});

	describe('add', () => {
		it('should add duration and return new timestamp', () => {
			const timestamp = Timestamp.from(1000);
			const duration = Duration.ofSeconds(5);
			const result = timestamp.add(duration);

			expect(result.value).toBe(6000);
			expect(result).not.toBe(timestamp); // Immutability check
		});
	});

	describe('subtract', () => {
		it('should subtract duration and return new timestamp', () => {
			const timestamp = Timestamp.from(10000);
			const duration = Duration.ofSeconds(3);
			const result = timestamp.subtract(duration);

			expect(result.value).toBe(7000);
			expect(result).not.toBe(timestamp); // Immutability check
		});
	});

	describe('isBefore', () => {
		it('should return true when timestamp is before other', () => {
			const t1 = Timestamp.from(1000);
			const t2 = Timestamp.from(2000);
			expect(t1.isBefore(t2)).toBe(true);
		});

		it('should return false when timestamp is not before other', () => {
			const t1 = Timestamp.from(2000);
			const t2 = Timestamp.from(1000);
			expect(t1.isBefore(t2)).toBe(false);
		});
	});

	describe('isAfter', () => {
		it('should return true when timestamp is after other', () => {
			const t1 = Timestamp.from(2000);
			const t2 = Timestamp.from(1000);
			expect(t1.isAfter(t2)).toBe(true);
		});

		it('should return false when timestamp is not after other', () => {
			const t1 = Timestamp.from(1000);
			const t2 = Timestamp.from(2000);
			expect(t1.isAfter(t2)).toBe(false);
		});
	});

	describe('equals', () => {
		it('should return true for equal timestamps', () => {
			const t1 = Timestamp.from(1000);
			const t2 = Timestamp.from(1000);
			expect(t1.equals(t2)).toBe(true);
		});

		it('should return false for different timestamps', () => {
			const t1 = Timestamp.from(1000);
			const t2 = Timestamp.from(2000);
			expect(t1.equals(t2)).toBe(false);
		});
	});

	describe('immutability', () => {
		it('should not mutate original timestamp when adding duration', () => {
			const original = Timestamp.from(1000);
			const originalValue = original.value;
			original.add(Duration.ofSeconds(5));
			expect(original.value).toBe(originalValue);
		});

		it('should not mutate original timestamp when subtracting duration', () => {
			const original = Timestamp.from(10000);
			const originalValue = original.value;
			original.subtract(Duration.ofSeconds(3));
			expect(original.value).toBe(originalValue);
		});
	});
});

