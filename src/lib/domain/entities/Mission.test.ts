import { describe, it, expect } from 'vitest';
import { Mission } from './Mission';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import type { MissionId } from './Mission';
import type { MissionAttributes } from '../attributes/MissionAttributes';
import { getTimer, setTimer } from '../primitives/TimerHelpers';
import type { RoleKey } from '../attributes/RoleKey';

describe('Mission', () => {
	const createMission = (overrides?: {
		missionType?: 'combat' | 'exploration' | 'investigation' | 'diplomacy' | 'resource';
		dc?: number;
		preferredRole?: RoleKey;
		tags?: string[];
		loreTags?: string[];
		state?: 'Available' | 'InProgress' | 'Completed' | 'Expired';
		metadata?: Record<string, unknown>;
	}): Mission => {
		const id: MissionId = Identifier.from('mission-1');
		const attributes: MissionAttributes = {
			missionType: overrides?.missionType || 'combat',
			primaryAbility: 'str',
			dc: overrides?.dc ?? 15,
			difficultyTier: 'Medium',
			preferredRole: overrides?.preferredRole,
			baseDuration: Duration.ofSeconds(60),
			baseRewards: { gold: 50, xp: 10 },
			maxPartySize: 1
		};

		const metadata = overrides?.loreTags
			? { ...(overrides?.metadata || {}), loreTags: overrides.loreTags }
			: overrides?.metadata || {};
		return new Mission(
			id,
			attributes,
			overrides?.tags || [],
			overrides?.state || 'Available',
			{},
			metadata
		);
	};

	describe('constructor', () => {
		it('should create valid mission with all attributes', () => {
			const mission = createMission({
				missionType: 'exploration',
				dc: 20,
				preferredRole: 'skill_specialist',
				tags: ['wilderness', 'dungeon'],
				loreTags: ['ancient-ruins', 'forest']
			});

			expect(mission.id).toBe('mission-1');
			expect(mission.type).toBe('Mission');
			expect(mission.attributes.missionType).toBe('exploration');
			expect(mission.attributes.dc).toBe(20);
			expect(mission.attributes.preferredRole).toBe('skill_specialist');
			expect(mission.tags).toEqual(['wilderness', 'dungeon']);
			expect(mission.metadata.loreTags).toEqual(['ancient-ruins', 'forest']);
			expect(mission.state).toBe('Available');
		});

		it('should create mission without loreTags', () => {
			const mission = createMission({
				missionType: 'combat',
				tags: ['undead']
			});

			expect(mission.metadata.loreTags).toBeUndefined();
		});

		it('should create mission without preferredRole', () => {
			const mission = createMission({
				missionType: 'combat'
			});

			expect(mission.attributes.preferredRole).toBeUndefined();
		});

		it('should use Record<string, number | null> for timers (not Map)', () => {
			const mission = createMission();

			expect(mission.timers).toBeInstanceOf(Object);
			expect(mission.timers).not.toBeInstanceOf(Map);
			expect(typeof mission.timers).toBe('object');
		});

		it('should copy tags array for immutability', () => {
			const tags = ['combat', 'undead'];
			const mission = createMission({ tags });

			// Modify original array
			tags.push('new-tag');

			// Mission tags should not be affected
			expect(mission.tags).toEqual(['combat', 'undead']);
		});

		it('should copy loreTags array for immutability', () => {
			const loreTags = ['forest', 'ruins'];
			const mission = createMission({ loreTags });

			// Modify original array
			loreTags.push('new-lore');

			// Mission metadata.loreTags should not be affected
			expect(mission.metadata.loreTags).toEqual(['forest', 'ruins']);
		});

		it('should copy metadata object for immutability', () => {
			const metadata = { name: 'Test Mission' };
			const mission = createMission({ metadata });

			// Modify original object
			metadata.name = 'Modified';

			// Mission metadata should not be affected
			expect(mission.metadata.name).toBe('Test Mission');
		});

		it('should copy timers object for immutability', () => {
			const timers = { startedAt: 1000 };
			const id: MissionId = Identifier.from('mission-2');
			const attributes: MissionAttributes = {
				missionType: 'combat',
				primaryAbility: 'str',
				dc: 15,
				difficultyTier: 'Easy',
				baseDuration: Duration.ofSeconds(60),
				baseRewards: { gold: 50, xp: 10 },
				maxPartySize: 1
			};
			const mission = new Mission(id, attributes, [], 'Available', timers, {});

			// Modify original object
			timers.startedAt = 2000;

			// Mission timers should not be affected
			expect(mission.timers['startedAt']).toBe(1000);
		});
	});

	describe('start', () => {
		it('should start mission and transition to InProgress', () => {
			const mission = createMission({ state: 'Available' });
			const startedAt = Timestamp.from(Date.now());
			const endsAt = Timestamp.from(Date.now() + 60000);

			mission.start(startedAt, endsAt);

			expect(mission.state).toBe('InProgress');
			expect(mission.timers['startedAt']).toBe(startedAt.value);
			expect(mission.timers['endsAt']).toBe(endsAt.value);
		});

		it('should store timers as milliseconds', () => {
			const mission = createMission({ state: 'Available' });
			// Use realistic timestamp values (year 2024)
			const baseTime = new Date('2024-01-01').getTime();
			const startedAt = Timestamp.from(baseTime);
			const endsAt = Timestamp.from(baseTime + 60000);

			mission.start(startedAt, endsAt);

			expect(mission.timers['startedAt']).toBe(baseTime);
			expect(mission.timers['endsAt']).toBe(baseTime + 60000);
			expect(typeof mission.timers['startedAt']).toBe('number');
			expect(typeof mission.timers['endsAt']).toBe('number');
		});

		it('should throw error if mission is not Available', () => {
			const mission = createMission({ state: 'InProgress' });
			const startedAt = Timestamp.from(Date.now());
			const endsAt = Timestamp.from(Date.now() + 60000);

			expect(() => mission.start(startedAt, endsAt)).toThrow(
				'Cannot start mission: mission state is InProgress'
			);
		});

		it('should throw error if endsAt is before startedAt', () => {
			const mission = createMission({ state: 'Available' });
			const startedAt = Timestamp.from(Date.now() + 60000);
			const endsAt = Timestamp.from(Date.now());

			expect(() => mission.start(startedAt, endsAt)).toThrow(/Invalid timer relationship/);
		});

		it('should throw error if endsAt equals startedAt', () => {
			const mission = createMission({ state: 'Available' });
			const timestamp = Timestamp.from(Date.now());

			expect(() => mission.start(timestamp, timestamp)).toThrow(/Invalid timer relationship/);
		});
	});

	describe('complete', () => {
		it('should complete mission and transition to Completed', () => {
			const mission = createMission({ state: 'InProgress' });
			const completedAt = Timestamp.from(Date.now());

			mission.complete(completedAt);

			expect(mission.state).toBe('Completed');
			expect(mission.timers['completedAt']).toBe(completedAt.value);
		});

		it('should store completedAt as milliseconds', () => {
			const mission = createMission({ state: 'InProgress' });
			const completedAt = Timestamp.from(5000);

			mission.complete(completedAt);

			expect(mission.timers['completedAt']).toBe(5000);
			expect(typeof mission.timers['completedAt']).toBe('number');
		});

		it('should throw error if mission is not InProgress', () => {
			const mission = createMission({ state: 'Available' });
			const completedAt = Timestamp.from(Date.now());

			expect(() => mission.complete(completedAt)).toThrow(
				'Cannot complete mission: mission state is Available'
			);
		});
	});

	describe('expire', () => {
		it('should expire mission from Available state', () => {
			const mission = createMission({ state: 'Available' });

			mission.expire();

			expect(mission.state).toBe('Expired');
		});

		it('should expire mission from InProgress state', () => {
			const mission = createMission({ state: 'InProgress' });

			mission.expire();

			expect(mission.state).toBe('Expired');
		});

		it('should throw error if mission is Completed', () => {
			const mission = createMission({ state: 'Completed' });

			expect(() => mission.expire()).toThrow('Cannot expire completed mission');
		});
	});

	describe('timer helpers', () => {
		it('should work with getTimer and setTimer using Record format', () => {
			const mission = createMission();
			const timestamp = Timestamp.from(Date.now() + 60000);

			setTimer(mission, 'endsAt', timestamp);

			const retrieved = getTimer(mission, 'endsAt');
			expect(retrieved).not.toBeNull();
			expect(retrieved?.value).toBe(timestamp.value);
			expect(mission.timers['endsAt']).toBe(timestamp.value);
		});

		it('should handle null timer values', () => {
			const mission = createMission();

			setTimer(mission, 'endsAt', null);

			expect(mission.timers['endsAt']).toBeNull();
			expect(getTimer(mission, 'endsAt')).toBeNull();
		});

		it('should return null for missing timer keys', () => {
			const mission = createMission();

			expect(getTimer(mission, 'nonexistent')).toBeNull();
		});
	});

	describe('state transitions', () => {
		it('should transition Available -> InProgress -> Completed', () => {
			const mission = createMission({ state: 'Available' });
			const startedAt = Timestamp.from(Date.now());
			const endsAt = Timestamp.from(Date.now() + 60000);
			const completedAt = Timestamp.from(Date.now() + 60000);

			mission.start(startedAt, endsAt);
			expect(mission.state).toBe('InProgress');

			mission.complete(completedAt);
			expect(mission.state).toBe('Completed');
		});
	});
});

