import { describe, it, expect } from 'vitest';
import { Adventurer } from './Adventurer';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import type { AdventurerId } from './Adventurer';
import type { MissionId } from './Mission';
import type { AdventurerAttributes } from '../attributes/AdventurerAttributes';
import { deriveRoleKey } from '../attributes/RoleKey';
import { getTimer, setTimer } from '../primitives/TimerHelpers';
import { Timestamp } from '../valueObjects/Timestamp';

describe('Adventurer', () => {
	const createAdventurer = (overrides?: {
		level?: number;
		xp?: number;
		traitTags?: string[];
		classKey?: string;
		tags?: string[];
		loreTags?: string[];
		state?: 'Idle' | 'OnMission' | 'Fatigued' | 'Recovering' | 'Dead';
		metadata?: Record<string, unknown>;
	}): Adventurer => {
		const id: AdventurerId = Identifier.from('adv-1');
		const classKey = overrides?.classKey || 'fighter';
		const attributes: AdventurerAttributes = {
			level: overrides?.level ?? 1,
			xp: overrides?.xp ?? 0,
			abilityMods: NumericStatMap.fromMap(new Map([
				['str', 0],
				['dex', 0],
				['con', 0],
				['int', 0],
				['wis', 0],
				['cha', 0]
			])),
			classKey,
			ancestryKey: 'human',
			traitTags: overrides?.traitTags || [],
			roleKey: deriveRoleKey(classKey),
			baseHP: 10,
			assignedSlotId: null
		};

		const metadata = overrides?.loreTags
			? { ...(overrides.metadata || {}), loreTags: overrides.loreTags }
			: overrides?.metadata || {};
		return new Adventurer(
			id,
			attributes,
			overrides?.tags || [],
			overrides?.state || 'Idle',
			{},
			metadata
		);
	};

	describe('constructor', () => {
		it('should create valid adventurer with all attributes', () => {
			const adventurer = createAdventurer({
				level: 1,
				xp: 0,
				traitTags: ['arcane', 'healing'],
				classKey: 'cleric',
				tags: ['divine', 'support'],
				loreTags: ['human', 'taldor']
			});

			expect(adventurer.id).toBe('adv-1');
			expect(adventurer.type).toBe('Adventurer');
			expect(adventurer.attributes.level).toBe(1);
			expect(adventurer.attributes.xp).toBe(0);
			expect(adventurer.attributes.traitTags).toEqual(['arcane', 'healing']);
			expect(adventurer.attributes.roleKey).toBe('support_caster');
			expect(adventurer.tags).toEqual(['divine', 'support']);
			expect(adventurer.metadata.loreTags).toEqual(['human', 'taldor']);
			expect(adventurer.state).toBe('Idle');
		});

		it('should create adventurer without loreTags', () => {
			const adventurer = createAdventurer({
				traitTags: ['finesse'],
				tags: ['ranged']
			});

			expect(adventurer.metadata.loreTags).toBeUndefined();
		});

		it('should create adventurer with EntityMetadata structure', () => {
			const metadata = {
				displayName: 'Test Hero',
				description: 'A test adventurer',
				visualKey: 'hero-1'
			};
			const adventurer = createAdventurer({ metadata });

			expect(adventurer.metadata.displayName).toBe('Test Hero');
			expect(adventurer.metadata.description).toBe('A test adventurer');
			expect(adventurer.metadata.visualKey).toBe('hero-1');
		});

		it('should copy tags array for immutability', () => {
			const tags = ['combat', 'melee'];
			const adventurer = createAdventurer({ tags });

			// Modify original array
			tags.push('new-tag');

			// Adventurer tags should not be affected
			expect(adventurer.tags).toEqual(['combat', 'melee']);
		});

		it('should copy loreTags array for immutability', () => {
			const loreTags = ['elf', 'forest'];
			const adventurer = createAdventurer({ loreTags });

			// Modify original array
			loreTags.push('new-lore');

			// Adventurer metadata.loreTags should not be affected
			expect(adventurer.metadata.loreTags).toEqual(['elf', 'forest']);
		});

		it('should copy metadata object for immutability', () => {
			const metadata = { name: 'Test' };
			const adventurer = createAdventurer({ metadata });

			// Modify original object
			metadata.name = 'Modified';

			// Adventurer metadata should not be affected
			expect(adventurer.metadata.name).toBe('Test');
		});

		it('should copy timers object for immutability', () => {
			const timers = { fatigueUntil: 1000 };
			const id: AdventurerId = Identifier.from('adv-2');
			const attributes: AdventurerAttributes = {
				level: 1,
				xp: 0,
				abilityMods: NumericStatMap.fromMap(new Map([['str', 0], ['dex', 0], ['con', 0], ['int', 0], ['wis', 0], ['cha', 0]])),
				classKey: 'fighter',
				ancestryKey: 'human',
				traitTags: [],
				roleKey: deriveRoleKey('fighter'),
				baseHP: 10,
				assignedSlotId: null
			};
			const adventurer = new Adventurer(id, attributes, [], 'Idle', timers, {});

			// Modify original object
			timers.fatigueUntil = 2000;

			// Adventurer timers should not be affected
			expect(adventurer.timers.fatigueUntil).toBe(1000);
		});
	});

	describe('assignToMission', () => {
		it('should assign adventurer to mission and transition to OnMission', () => {
			const adventurer = createAdventurer({ state: 'Idle' });
			const missionId: MissionId = Identifier.from('mission-1');

			adventurer.assignToMission(missionId);

			expect(adventurer.state).toBe('OnMission');
			expect(adventurer.metadata.currentMissionId).toBe('mission-1');
		});

		it('should throw error if adventurer is not Idle', () => {
			const adventurer = createAdventurer({ state: 'OnMission' });
			const missionId: MissionId = Identifier.from('mission-1');

			expect(() => { adventurer.assignToMission(missionId); }).toThrow(
				'Cannot assign adventurer to mission: adventurer state is OnMission'
			);
		});

		it('should throw error if adventurer is Fatigued', () => {
			const adventurer = createAdventurer({ state: 'Fatigued' });
			const missionId: MissionId = Identifier.from('mission-1');

			expect(() => { adventurer.assignToMission(missionId); }).toThrow(
				'Cannot assign adventurer to mission: adventurer state is Fatigued'
			);
		});
	});

	describe('completeMission', () => {
		it('should complete mission and transition to Idle', () => {
			const adventurer = createAdventurer({ state: 'OnMission' });
			adventurer.metadata.currentMissionId = 'mission-1';

			adventurer.completeMission();

			expect(adventurer.state).toBe('Idle');
			expect(adventurer.metadata.currentMissionId).toBeUndefined();
		});

		it('should throw error if adventurer is not OnMission', () => {
			const adventurer = createAdventurer({ state: 'Idle' });

			expect(() => { adventurer.completeMission(); }).toThrow(
				'Cannot complete mission: adventurer state is Idle'
			);
		});
	});

	describe('applyXP', () => {
		it('should add XP to adventurer', () => {
			const adventurer = createAdventurer({ xp: 0 });

			adventurer.applyXP(50);

			expect(adventurer.attributes.xp).toBe(50);
		});

		it('should accumulate XP', () => {
			const adventurer = createAdventurer({ xp: 25 });

			adventurer.applyXP(30);
			adventurer.applyXP(15);

			expect(adventurer.attributes.xp).toBe(70);
		});

		it('should throw error for negative XP', () => {
			const adventurer = createAdventurer({ xp: 50 });

			expect(() => { adventurer.applyXP(-10); }).toThrow('Cannot apply negative XP: -10');
		});

		it('should allow zero XP', () => {
			const adventurer = createAdventurer({ xp: 0 });

			adventurer.applyXP(0);

			expect(adventurer.attributes.xp).toBe(0);
		});
	});

	describe('levelUp', () => {
		it('should increment level', () => {
			const adventurer = createAdventurer({ level: 1 });

			adventurer.levelUp();

			expect(adventurer.attributes.level).toBe(2);
		});

		it('should increment level multiple times', () => {
			const adventurer = createAdventurer({ level: 1 });

			adventurer.levelUp();
			adventurer.levelUp();
			adventurer.levelUp();

			expect(adventurer.attributes.level).toBe(4);
		});
	});

	describe('timer helpers', () => {
		it('should work with getTimer and setTimer using Record format', () => {
			const adventurer = createAdventurer();
			const timestamp = Timestamp.from(Date.now() + 60000); // 1 minute from now

			setTimer(adventurer, 'fatigueUntil', timestamp);

			const retrieved = getTimer(adventurer, 'fatigueUntil');
			expect(retrieved).not.toBeNull();
			expect(retrieved?.value).toBe(timestamp.value);
			expect(adventurer.timers['fatigueUntil']).toBe(timestamp.value);
		});

		it('should handle null timer values', () => {
			const adventurer = createAdventurer();

			setTimer(adventurer, 'fatigueUntil', null);

			expect(adventurer.timers['fatigueUntil']).toBeNull();
			expect(getTimer(adventurer, 'fatigueUntil')).toBeNull();
		});

		it('should return null for missing timer keys', () => {
			const adventurer = createAdventurer();

			expect(getTimer(adventurer, 'nonexistent')).toBeNull();
		});
	});

	describe('state transitions', () => {
		it('should transition Idle -> OnMission -> Idle', () => {
			const adventurer = createAdventurer({ state: 'Idle' });
			const missionId: MissionId = Identifier.from('mission-1');

			adventurer.assignToMission(missionId);
			expect(adventurer.state).toBe('OnMission');

			adventurer.completeMission();
			expect(adventurer.state).toBe('Idle');
		});
	});
});

