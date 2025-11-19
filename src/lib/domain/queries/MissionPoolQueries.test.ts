/**
 * Mission Pool Queries Tests - Mission pool adventurer queries
 */

import { describe, it, expect } from 'vitest';
import {
	getMissionPoolAdventurers,
	getAssignedAdventurers,
	getIdleAdventurers
} from './MissionPoolQueries';
import { createTestGameState, createTestAdventurer } from '../../test-utils/testFactories';
import type { Entity } from '../primitives/Requirement';

describe('MissionPoolQueries', () => {
	describe('getMissionPoolAdventurers', () => {
		it('should return empty array when no adventurers exist', () => {
			const state = createTestGameState();
			expect(getMissionPoolAdventurers(state)).toHaveLength(0);
		});

		it('should return Idle adventurers with no slot assignment', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });

			const pool = getMissionPoolAdventurers(state);
			expect(pool).toHaveLength(1);
			expect(pool[0].id).toBe('adv-1');
		});

		it('should exclude adventurers assigned to slots', () => {
			const idleAdventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const assignedAdventurer = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			assignedAdventurer.attributes.assignedSlotId = 'slot-1';
			const entities = new Map<string, Entity>([
				[idleAdventurer.id, idleAdventurer],
				[assignedAdventurer.id, assignedAdventurer]
			]);
			const state = createTestGameState({ entities });

			const pool = getMissionPoolAdventurers(state);
			expect(pool).toHaveLength(1);
			expect(pool[0].id).toBe('adv-1');
		});

		it('should exclude adventurers on missions', () => {
			const idleAdventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const onMissionAdventurer = createTestAdventurer({ id: 'adv-2', state: 'OnMission' });
			const entities = new Map<string, Entity>([
				[idleAdventurer.id, idleAdventurer],
				[onMissionAdventurer.id, onMissionAdventurer]
			]);
			const state = createTestGameState({ entities });

			const pool = getMissionPoolAdventurers(state);
			expect(pool).toHaveLength(1);
			expect(pool[0].id).toBe('adv-1');
		});

		it('should return multiple eligible adventurers', () => {
			const adventurer1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const adventurer2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const adventurer3 = createTestAdventurer({ id: 'adv-3', state: 'Idle' });
			const entities = new Map<string, Entity>([
				[adventurer1.id, adventurer1],
				[adventurer2.id, adventurer2],
				[adventurer3.id, adventurer3]
			]);
			const state = createTestGameState({ entities });

			const pool = getMissionPoolAdventurers(state);
			expect(pool).toHaveLength(3);
		});
	});

	describe('getAssignedAdventurers', () => {
		it('should return empty array when no adventurers assigned', () => {
			const state = createTestGameState();
			expect(getAssignedAdventurers(state)).toHaveLength(0);
		});

		it('should return adventurers with slot assignments', () => {
			const assignedAdventurer = createTestAdventurer({ id: 'adv-1' });
			assignedAdventurer.attributes.assignedSlotId = 'slot-1';
			const unassignedAdventurer = createTestAdventurer({ id: 'adv-2' });
			const entities = new Map<string, Entity>([
				[assignedAdventurer.id, assignedAdventurer],
				[unassignedAdventurer.id, unassignedAdventurer]
			]);
			const state = createTestGameState({ entities });

			const assigned = getAssignedAdventurers(state);
			expect(assigned).toHaveLength(1);
			expect(assigned[0].id).toBe('adv-1');
		});

		it('should return all assigned adventurers', () => {
			const assigned1 = createTestAdventurer({ id: 'adv-1' });
			assigned1.attributes.assignedSlotId = 'slot-1';
			const assigned2 = createTestAdventurer({ id: 'adv-2' });
			assigned2.attributes.assignedSlotId = 'slot-2';
			const entities = new Map<string, Entity>([
				[assigned1.id, assigned1],
				[assigned2.id, assigned2]
			]);
			const state = createTestGameState({ entities });

			const assigned = getAssignedAdventurers(state);
			expect(assigned).toHaveLength(2);
		});
	});

	describe('getIdleAdventurers', () => {
		it('should return empty array when no idle adventurers', () => {
			const state = createTestGameState();
			expect(getIdleAdventurers(state)).toHaveLength(0);
		});

		it('should return all Idle adventurers', () => {
			const idle1 = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const idle2 = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			const onMission = createTestAdventurer({ id: 'adv-3', state: 'OnMission' });
			const entities = new Map<string, Entity>([
				[idle1.id, idle1],
				[idle2.id, idle2],
				[onMission.id, onMission]
			]);
			const state = createTestGameState({ entities });

			const idle = getIdleAdventurers(state);
			expect(idle).toHaveLength(2);
			expect(idle.map(a => a.id)).toContain('adv-1');
			expect(idle.map(a => a.id)).toContain('adv-2');
		});

		it('should include idle adventurers regardless of slot assignment', () => {
			const idleUnassigned = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const idleAssigned = createTestAdventurer({ id: 'adv-2', state: 'Idle' });
			idleAssigned.attributes.assignedSlotId = 'slot-1';
			const entities = new Map<string, Entity>([
				[idleUnassigned.id, idleUnassigned],
				[idleAssigned.id, idleAssigned]
			]);
			const state = createTestGameState({ entities });

			const idle = getIdleAdventurers(state);
			expect(idle).toHaveLength(2);
		});
	});
});

