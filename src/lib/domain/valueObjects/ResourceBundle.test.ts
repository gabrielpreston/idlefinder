import { describe, it, expect } from 'vitest';
import { ResourceBundle } from './ResourceBundle';
import { ResourceUnit } from './ResourceUnit';

describe('ResourceBundle', () => {
	describe('constructor', () => {
		it('should create valid resource bundle', () => {
			const resources = new Map<string, number>([['gold', 100], ['wood', 50]]);
			const bundle = new ResourceBundle(resources);
			expect(bundle.get('gold')).toBe(100);
			expect(bundle.get('wood')).toBe(50);
		});

		it('should throw error for negative amounts', () => {
			const resources = new Map<string, number>([['gold', -10]]);
			expect(() => new ResourceBundle(resources)).toThrow('Resource amount cannot be negative');
		});
	});

	describe('add', () => {
		it('should add resources and return new bundle', () => {
			const bundle1 = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('wood', 50)
			]);
			const bundle2 = ResourceBundle.fromArray([
				new ResourceUnit('gold', 25),
				new ResourceUnit('stone', 10)
			]);
			const result = bundle1.add(bundle2);

			expect(result.get('gold')).toBe(125);
			expect(result.get('wood')).toBe(50);
			expect(result.get('stone')).toBe(10);
			expect(result).not.toBe(bundle1); // Immutability check
		});
	});

	describe('subtract', () => {
		it('should subtract resources and return new bundle', () => {
			const bundle1 = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('wood', 50)
			]);
			const bundle2 = ResourceBundle.fromArray([
				new ResourceUnit('gold', 25),
				new ResourceUnit('wood', 10)
			]);
			const result = bundle1.subtract(bundle2);

			expect(result.get('gold')).toBe(75);
			expect(result.get('wood')).toBe(40);
			expect(result).not.toBe(bundle1); // Immutability check
		});

		it('should throw error if subtraction would create negative', () => {
			const bundle1 = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			const bundle2 = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(() => bundle1.subtract(bundle2)).toThrow('Cannot subtract');
		});

		it('should remove resource type when amount becomes zero', () => {
			const bundle1 = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			const bundle2 = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			const result = bundle1.subtract(bundle2);
			expect(result.get('gold')).toBe(0);
			expect(result.isEmpty()).toBe(true);
		});
	});

	describe('hasResources', () => {
		it('should return true when bundle has sufficient resources', () => {
			const bundle1 = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('wood', 50)
			]);
			const bundle2 = ResourceBundle.fromArray([
				new ResourceUnit('gold', 50),
				new ResourceUnit('wood', 25)
			]);
			expect(bundle1.hasResources(bundle2)).toBe(true);
		});

		it('should return false when bundle lacks sufficient resources', () => {
			const bundle1 = ResourceBundle.fromArray([new ResourceUnit('gold', 50)]);
			const bundle2 = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(bundle1.hasResources(bundle2)).toBe(false);
		});

		it('should return false when bundle lacks resource type', () => {
			const bundle1 = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			const bundle2 = ResourceBundle.fromArray([new ResourceUnit('wood', 50)]);
			expect(bundle1.hasResources(bundle2)).toBe(false);
		});
	});

	describe('isEmpty', () => {
		it('should return true for empty bundle', () => {
			const bundle = new ResourceBundle(new Map<string, number>());
			expect(bundle.isEmpty()).toBe(true);
		});

		it('should return false for bundle with resources', () => {
			const bundle = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(bundle.isEmpty()).toBe(false);
		});
	});

	describe('merge', () => {
		it('should merge bundles and return new bundle', () => {
			const bundle1 = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			const bundle2 = ResourceBundle.fromArray([new ResourceUnit('wood', 50)]);
			const result = bundle1.merge(bundle2);

			expect(result.get('gold')).toBe(100);
			expect(result.get('wood')).toBe(50);
			expect(result).not.toBe(bundle1); // Immutability check
		});
	});

	describe('get', () => {
		it('should return amount for existing resource', () => {
			const bundle = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(bundle.get('gold')).toBe(100);
		});

		it('should return 0 for non-existing resource', () => {
			const bundle = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			expect(bundle.get('wood')).toBe(0);
		});
	});

	describe('toArray', () => {
		it('should convert bundle to array of ResourceUnits', () => {
			const bundle = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('wood', 50)
			]);
			const units = bundle.toArray();

			expect(units.length).toBe(2);
			expect(units.some(u => u.resourceType === 'gold' && u.amount === 100)).toBe(true);
			expect(units.some(u => u.resourceType === 'wood' && u.amount === 50)).toBe(true);
		});
	});

	describe('fromArray', () => {
		it('should create bundle from array of ResourceUnits', () => {
			const units = [
				new ResourceUnit('gold', 100),
				new ResourceUnit('wood', 50)
			];
			const bundle = ResourceBundle.fromArray(units);

			expect(bundle.get('gold')).toBe(100);
			expect(bundle.get('wood')).toBe(50);
		});

		it('should merge duplicate resource types', () => {
			const units = [
				new ResourceUnit('gold', 50),
				new ResourceUnit('gold', 50)
			];
			const bundle = ResourceBundle.fromArray(units);

			expect(bundle.get('gold')).toBe(100);
		});
	});

	describe('immutability', () => {
		it('should not mutate original bundle when adding', () => {
			const original = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			const originalGold = original.get('gold');
			original.add(ResourceBundle.fromArray([new ResourceUnit('wood', 50)]));
			expect(original.get('gold')).toBe(originalGold);
		});

		it('should not mutate original bundle when subtracting', () => {
			const original = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
			const originalGold = original.get('gold');
			original.subtract(ResourceBundle.fromArray([new ResourceUnit('gold', 25)]));
			expect(original.get('gold')).toBe(originalGold);
		});
	});
});

