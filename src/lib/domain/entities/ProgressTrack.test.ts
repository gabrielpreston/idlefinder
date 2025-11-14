import { describe, it, expect } from 'vitest';
import { ProgressTrack } from './ProgressTrack';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type { ProgressTrackId, OrganizationId } from '$lib/domain/valueObjects/Identifier';

describe('ProgressTrack', () => {
	const createTrack = (
		currentValue: number = 0
	): ProgressTrack => {
		const id: ProgressTrackId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		return new ProgressTrack(id, orgId, 'test-track', currentValue);
	};

	describe('constructor', () => {
		it('should create valid progress track', () => {
			const track = createTrack(100);
			expect(track.currentValue).toBe(100);
			expect(track.trackKey).toBe('test-track');
		});

		it('should throw error for negative initial value', () => {
			expect(() => createTrack(-1)).toThrow('ProgressTrack currentValue cannot be negative');
		});
	});

	describe('increment', () => {
		it('should increment current value', () => {
			const track = createTrack(50);
			track.increment(25);
			expect(track.currentValue).toBe(75);
		});

		it('should throw error for negative increment', () => {
			const track = createTrack(50);
			expect(() => track.increment(-10)).toThrow('Cannot increment by negative amount');
		});
	});

	describe('setValue', () => {
		it('should set current value', () => {
			const track = createTrack(50);
			track.setValue(100);
			expect(track.currentValue).toBe(100);
		});

		it('should throw error for negative value', () => {
			const track = createTrack(50);
			expect(() => track.setValue(-10)).toThrow('ProgressTrack value cannot be negative');
		});
	});

	describe('hasReachedThreshold', () => {
		it('should return true when value exceeds threshold', () => {
			const track = createTrack(100);
			expect(track.hasReachedThreshold(50)).toBe(true);
		});

		it('should return true when value equals threshold', () => {
			const track = createTrack(50);
			expect(track.hasReachedThreshold(50)).toBe(true);
		});

		it('should return false when value is below threshold', () => {
			const track = createTrack(25);
			expect(track.hasReachedThreshold(50)).toBe(false);
		});
	});
});

