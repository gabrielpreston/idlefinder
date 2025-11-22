/**
 * ResourceSlot Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { ResourceSlot } from './ResourceSlot';
import { Identifier } from '../valueObjects/Identifier';

function createTestSlot(overrides?: {
	state?: 'available' | 'occupied';
	assigneeType?: 'none' | 'player' | 'adventurer';
	assigneeId?: string | null;
}): ResourceSlot {
	const id = Identifier.from<'SlotId'>('slot-1');
	return new ResourceSlot(
		id,
		{
			facilityId: 'facility-1',
			resourceType: 'gold',
			baseRatePerMinute: 10,
			assigneeType: overrides?.assigneeType || 'none',
			assigneeId: overrides?.assigneeId ?? null,
			fractionalAccumulator: 0
		},
		[],
		overrides?.state || 'available',
		{},
		{}
	);
}

describe('ResourceSlot', () => {
	describe('constructor', () => {
		it('should create valid resource slot', () => {
			const slot = createTestSlot();
			expect(slot.type).toBe('ResourceSlot');
			expect(slot.attributes.resourceType).toBe('gold');
			expect(slot.state).toBe('available');
		});
	});

	describe('assignWorker', () => {
		it('should assign player to slot', () => {
			const slot = createTestSlot({ state: 'available' });

			slot.assignWorker('player', null);

			expect(slot.attributes.assigneeType).toBe('player');
			expect(slot.attributes.assigneeId).toBeNull();
			expect(slot.state).toBe('occupied');
		});

		it('should assign adventurer to slot', () => {
			const slot = createTestSlot({ state: 'available' });

			slot.assignWorker('adventurer', 'adv-1');

			expect(slot.attributes.assigneeType).toBe('adventurer');
			expect(slot.attributes.assigneeId).toBe('adv-1');
			expect(slot.state).toBe('occupied');
		});

		it('should allow reassigning to occupied slot', () => {
			const slot = createTestSlot({ state: 'occupied', assigneeType: 'player' });

			slot.assignWorker('adventurer', 'adv-1');

			expect(slot.attributes.assigneeType).toBe('adventurer');
			expect(slot.attributes.assigneeId).toBe('adv-1');
		});

		it('should throw error when slot state is invalid', () => {
			const slot = createTestSlot();
			// Set invalid state (not possible through constructor, but test edge case)
			(slot as any).state = 'invalid';

			expect(() => { slot.assignWorker('player', null); }).toThrow(
				'Cannot assign worker to slot: slot state is invalid'
			);
		});
	});

	describe('unassignWorker', () => {
		it('should unassign worker from slot', () => {
			const slot = createTestSlot({
				state: 'occupied',
				assigneeType: 'player',
				assigneeId: null
			});

			slot.unassignWorker();

			expect(slot.attributes.assigneeType).toBe('none');
			expect(slot.attributes.assigneeId).toBeNull();
			expect(slot.state).toBe('available');
		});

		it('should throw error when slot is not occupied', () => {
			const slot = createTestSlot({ state: 'available' });

			expect(() => { slot.unassignWorker(); }).toThrow(
				'Cannot unassign worker from slot: slot state is available'
			);
		});
	});
});

