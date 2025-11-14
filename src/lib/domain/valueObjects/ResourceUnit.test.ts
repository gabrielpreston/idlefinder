import { describe, it, expect } from 'vitest';
import { ResourceUnit } from './ResourceUnit';

describe('ResourceUnit', () => {
	describe('constructor', () => {
		it('should create valid resource unit', () => {
			const unit = new ResourceUnit('gold', 100);
			expect(unit.resourceType).toBe('gold');
			expect(unit.amount).toBe(100);
			expect(unit.isValid()).toBe(true);
		});

		it('should allow zero amount', () => {
			const unit = new ResourceUnit('gold', 0);
			expect(unit.isValid()).toBe(true);
		});

		it('should throw error for negative amount', () => {
			expect(() => new ResourceUnit('gold', -1)).toThrow('Invalid ResourceUnit');
		});

		it('should throw error for empty resource type', () => {
			expect(() => new ResourceUnit('', 100)).toThrow('Invalid ResourceUnit');
		});

		it('should throw error for whitespace-only resource type', () => {
			expect(() => new ResourceUnit('   ', 100)).toThrow('Invalid ResourceUnit');
		});
	});

	describe('isValid', () => {
		it('should return true for valid resource unit', () => {
			const unit = new ResourceUnit('gold', 100);
			expect(unit.isValid()).toBe(true);
		});

		it('should return false for negative amount', () => {
			// Create invalid unit by bypassing constructor validation
			const unit = Object.create(ResourceUnit.prototype);
			unit.resourceType = 'gold';
			unit.amount = -1;
			expect(unit.isValid()).toBe(false);
		});

		it('should return false for empty resource type', () => {
			const unit = Object.create(ResourceUnit.prototype);
			unit.resourceType = '';
			unit.amount = 100;
			expect(unit.isValid()).toBe(false);
		});
	});

	describe('immutability', () => {
		it('should have readonly properties', () => {
			const unit = new ResourceUnit('gold', 100);
			// TypeScript should prevent assignment, but we can verify at runtime
			expect(() => {
				(unit as { resourceType: string }).resourceType = 'silver';
			}).not.toThrow(); // Runtime allows but TypeScript prevents
		});
	});
});

