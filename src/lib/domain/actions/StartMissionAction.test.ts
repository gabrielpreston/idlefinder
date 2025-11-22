/**
 * StartMissionAction Tests
 */

import { describe, it, expect } from 'vitest';
import { StartMissionAction } from './StartMissionAction';
import { createTestAdventurer, createTestMission } from '../../test-utils/testFactories';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import type { RequirementContext, Entity } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import type { Effect } from '../primitives/Effect';
import { applyEffects } from '../primitives/Effect';
import { getTimer } from '../primitives/TimerHelpers';

describe('StartMissionAction', () => {
	describe('computeEffects', () => {
		it('should use provided startedAt when given', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const customStartTime = Timestamp.from(Date.now() - 1000);
			const context: RequirementContext = {
				entities,
				resources,
				currentTime: Timestamp.now()
			};

			const action = new StartMissionAction('mission-1', 'adv-1');
			const effects = action.computeEffects(context, {
				startedAt: customStartTime
			});

			// Apply effects and verify timer was set (behavioral test)
			const result = applyEffects(effects, entities, resources);
			const updatedMission = result.entities.get('mission-1');
			expect(updatedMission).toBeDefined();
			
			// Verify timer was set using public API
			const startedAtTimer = getTimer(updatedMission as Entity & { timers: Record<string, number | null> }, 'startedAt');
			expect(startedAtTimer).toBeDefined();
			expect(startedAtTimer?.value).toBe(customStartTime.value);
		});

		it('should use context.currentTime when startedAt not provided', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const context: RequirementContext = {
				entities,
				resources,
				currentTime: Timestamp.now()
			};

			const action = new StartMissionAction('mission-1', 'adv-1');
			const effects = action.computeEffects(context, {});

			// Should have SetTimerEffect with context time
			expect(effects.length).toBeGreaterThan(0);
		});
	});

	describe('generateEvents', () => {
		it('should return empty array when mission not found', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const effects: Effect[] = [];

			const action = new StartMissionAction('nonexistent-mission', 'adv-1');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return empty array when adventurer not found', () => {
			const mission = createTestMission({ id: 'mission-1' });
			const entities = new Map<string, Entity>([[mission.id, mission]]);
			const resources = ResourceBundle.fromArray([]);
			const effects: Effect[] = [];

			const action = new StartMissionAction('mission-1', 'nonexistent-adventurer');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return empty array when both mission and adventurer not found', () => {
			const entities = new Map<string, Entity>();
			const resources = ResourceBundle.fromArray([]);
			 
			const effects: Effect[] = [];

			const action = new StartMissionAction('nonexistent-mission', 'nonexistent-adventurer');
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return MissionStarted event when both exist', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const startedAt = Timestamp.now();
			const endsAt = startedAt.add(Duration.ofSeconds(600));
			const effects: Effect[] = [];

			const action = new StartMissionAction('mission-1', 'adv-1');
			const events = action.generateEvents(entities, resources, effects, {
				startedAt,
				endsAt
			});

			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('MissionStarted');
		});

		it('should use mission baseDuration when endsAt not provided', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const startedAt = Timestamp.now();
			const effects: Effect[] = [];

			const action = new StartMissionAction('mission-1', 'adv-1');
			const events = action.generateEvents(entities, resources, effects, {
				startedAt
				// endsAt not provided
			});

			expect(events.length).toBe(1);
			if (events[0]?.type === 'MissionStarted') {
				expect((events[0].payload as { duration: number }).duration).toBeDefined();
			}
		});

		it('should use Duration.between when both endsAt timer and startedAt are provided', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const startedAt = Timestamp.now();
			const endsAt = startedAt.add(Duration.ofSeconds(600));
			// Set endsAt timer on mission
			mission.timers = { endsAt: endsAt.value };
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const effects: Effect[] = [];

			const action = new StartMissionAction('mission-1', 'adv-1');
			const events = action.generateEvents(entities, resources, effects, {
				startedAt
			});

			expect(events.length).toBe(1);
			if (events[0]?.type === 'MissionStarted') {
				// Duration should be calculated from endsAt - startedAt
				expect((events[0].payload as { duration: number }).duration).toBe(600000); // 10 minutes in ms
			}
		});

		it('should use mission baseDuration when endsAt timer is not set', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			// Ensure endsAt timer is not set
			mission.timers = {};
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const startedAt = Timestamp.now();
			const effects: Effect[] = [];

			const action = new StartMissionAction('mission-1', 'adv-1');
			const events = action.generateEvents(entities, resources, effects, {
				startedAt
			});

			expect(events.length).toBe(1);
			if (events[0]?.type === 'MissionStarted') {
				// Should use mission baseDuration
				expect((events[0].payload as { duration: number }).duration).toBeDefined();
			}
		});

		it('should use mission baseDuration when startedAt is not provided', () => {
			const mission = createTestMission({ id: 'mission-1', state: 'Available' });
			const adventurer = createTestAdventurer({ id: 'adv-1', state: 'Idle' });
			const endsAt = Timestamp.now().add(Duration.ofSeconds(600));
			// Set endsAt timer but not startedAt
			mission.timers = { endsAt: endsAt.value };
			const entities = new Map<string, Entity>([[mission.id, mission], [adventurer.id, adventurer]]);
			const resources = ResourceBundle.fromArray([]);
			const effects: Effect[] = [];

			const action = new StartMissionAction('mission-1', 'adv-1');
			const events = action.generateEvents(entities, resources, effects, {
				// startedAt not provided
			});

			expect(events.length).toBe(1);
			if (events[0]?.type === 'MissionStarted') {
				const payload = events[0].payload as { duration: number; startTime: string };
				// Should use mission baseDuration because startedAt is not provided
				expect(payload.duration).toBeDefined();
				// startTime should use new Date().toISOString() when startedAt is not provided
				expect(payload.startTime).toBeDefined();
			}
		});
	});
});

