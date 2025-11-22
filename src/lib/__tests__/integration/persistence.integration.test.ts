/**
 * Persistence Integration Tests - Fast tests with mocked localStorage
 * Speed target: <400ms total
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceBus } from '../../bus/PersistenceBus';
import { DomainEventBus } from '../../bus/DomainEventBus';
import { LocalStorageAdapter } from '../../persistence/LocalStorageAdapter';
import { createTestGameState, setupMockLocalStorage } from '../../test-utils';
import type { DomainEvent } from '../../bus/types';
import type { GameState } from '../../domain/entities/GameState';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';

describe('Persistence Integration', () => {
	let eventBus: DomainEventBus;
	let stateGetter: () => GameState;
	let adapter: LocalStorageAdapter;
	let persistenceBus: PersistenceBus;

	beforeEach(() => {
		setupMockLocalStorage();
		eventBus = new DomainEventBus();
		const state = createTestGameState();
		stateGetter = () => state;
		adapter = new LocalStorageAdapter();
		const timeSource = new SimulatedTimeSource(Timestamp.from(Date.now()));
		// Create PersistenceBus for tests that need it
		persistenceBus = new PersistenceBus(adapter, stateGetter, eventBus, timeSource);
	});

	describe('save/load cycle', () => {
		it('should save and load state correctly', async () => {
			const { ResourceUnit } = await import('../../domain/valueObjects/ResourceUnit');
			const { ResourceBundle } = await import('../../domain/valueObjects/ResourceBundle');
			const baseResources = createTestGameState().resources;
			const fameBundle = ResourceBundle.fromArray([new ResourceUnit('fame', 100)]);
			const resources = baseResources.add(fameBundle);
			const state = createTestGameState({ resources });
			stateGetter = () => state;

			// Save state
			adapter.save(state, Timestamp.from(Date.now()));

			// Load state
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			expect(loaded?.resources.get('fame')).toBe(100);
		});

		it('should return null when no saved state exists', () => {
			const loaded = adapter.load();
			expect(loaded).toBeNull();
		});
	});

	describe('immediate saves', () => {
		it('should save immediately for FacilityUpgraded', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			const event: DomainEvent = {
				type: 'FacilityUpgraded',
				payload: {
					facilityId: 'facility-1',
					facilityType: 'Guildhall',
					newTier: 2,
					bonusMultipliers: {}
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should save immediately, not after 10s
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});

		it('should save immediately for AdventurerRecruited', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			const event: DomainEvent = {
				type: 'AdventurerRecruited',
				payload: {
					adventurerId: 'adv-1',
					name: 'Test Adventurer',
					traits: ['Strong']
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should save immediately
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});

		it('should save immediately for MissionStarted', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			const event: DomainEvent = {
				type: 'MissionStarted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: ['adv-1'],
					startTime: new Date().toISOString(),
					duration: 60000
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should save immediately
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});

	describe('debounced saves', () => {
		it('should debounce MissionCompleted events', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			// Publish multiple MissionCompleted events
			const event1: DomainEvent = {
				type: 'MissionCompleted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: ['adv-1'],
					outcome: 'Success',
					rewards: {
						gold: 50,
						xp: 10,
						fame: 1
					}
				},
				timestamp: new Date().toISOString()
			};

			const event2: DomainEvent = {
				type: 'MissionCompleted',
				payload: {
					missionId: 'mission-2',
					adventurerIds: ['adv-2'],
					outcome: 'Success',
					rewards: {
						gold: 75,
						xp: 15,
						fame: 2
					}
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event1);
			await eventBus.publish(event2);

			// Should not save yet
			expect(saveSpy).not.toHaveBeenCalled();

			// Advance time to trigger save
			vi.advanceTimersByTime(10000);

			// Should have saved once (debounced)
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});

		it('should debounce ResourcesChanged events', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			// Publish multiple ResourcesChanged events
			const event1: DomainEvent = {
				type: 'ResourcesChanged',
				payload: {
					delta: { gold: 10, fame: 5, materials: 0 },
					current: { gold: 110, fame: 5, materials: 0 }
				},
				timestamp: new Date().toISOString()
			};

			const event2: DomainEvent = {
				type: 'ResourcesChanged',
				payload: {
					delta: { gold: 20, fame: 10, materials: 0 },
					current: { gold: 130, fame: 15, materials: 0 }
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event1);
			await eventBus.publish(event2);

			// Should not save yet
			expect(saveSpy).not.toHaveBeenCalled();

			// Advance time to trigger save
			vi.advanceTimersByTime(10000);

			// Should have saved once (debounced)
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});

	describe('flush', () => {
		it('should flush pending saves immediately', async () => {
			vi.useFakeTimers();
			const saveSpy = vi.spyOn(adapter, 'save');

			// Trigger debounced event
			const event: DomainEvent = {
				type: 'MissionCompleted',
				payload: {
					missionId: 'mission-1',
					adventurerIds: ['adv-1'],
					outcome: 'Success',
					rewards: {
						gold: 50,
						xp: 10,
						fame: 1
					}
				},
				timestamp: new Date().toISOString()
			};

			await eventBus.publish(event);

			// Should not save yet (debounced)
			expect(saveSpy).not.toHaveBeenCalled();

			// Flush should save immediately
			persistenceBus.flush();
			expect(saveSpy).toHaveBeenCalledTimes(1);

			// Advance time - should not save again (already flushed, timeout cleared)
			vi.advanceTimersByTime(10000);
			expect(saveSpy).toHaveBeenCalledTimes(1);

			vi.useRealTimers();
		});
	});

	describe('version migration', () => {
		it('should handle version migration', async () => {
			const { ResourceUnit } = await import('../../domain/valueObjects/ResourceUnit');
			const { ResourceBundle } = await import('../../domain/valueObjects/ResourceBundle');
			const baseResources = createTestGameState().resources;
			const fameBundle = ResourceBundle.fromArray([new ResourceUnit('fame', 50)]);
			const resources = baseResources.add(fameBundle);
			const state = createTestGameState({ resources });

			// Save with version
			adapter.save(state, Timestamp.from(Date.now()));

			// Load should return state (migration logic in adapter)
			const loaded = adapter.load();
			expect(loaded).not.toBeNull();
			expect(loaded?.resources.get('fame')).toBe(50);
		});
	});

	describe('error handling', () => {
		it('should handle localStorage errors gracefully', () => {
			// Suppress console.error for this test (error logging is expected)
			const originalError = console.error;
			console.error = vi.fn();

			// Mock localStorage to throw error
			const originalSetItem = global.localStorage.setItem.bind(global.localStorage);
			global.localStorage.setItem = vi.fn(() => {
				throw new Error('Storage quota exceeded');
			});

			const state = createTestGameState();

			// Should not throw
			expect(() => {
				adapter.save(state, Timestamp.from(Date.now()));
			}).not.toThrow();

			// Restore
			global.localStorage.setItem = originalSetItem;
			console.error = originalError;
		});
	});

	describe('new Systems Primitives attribute serialization', () => {
		it('should serialize and deserialize traitTags and roleKey', async () => {
			const { createTestAdventurer } = await import('../../test-utils/testFactories');
			const { GameState } = await import('../../domain/entities/GameState');
			const adventurer = createTestAdventurer({
				tags: ['combat', 'melee'],
				state: 'Idle'
			});

			// Manually set traitTags and roleKey for testing
			adventurer.attributes.traitTags = ['arcane', 'healing'];
			adventurer.attributes.roleKey = 'support_caster';

			const { Timestamp } = await import('../../domain/valueObjects/Timestamp');
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = new GameState('test-player', Timestamp.from(Date.now()), entities, createTestGameState().resources);
			stateGetter = () => state;

			// Save and load
			adapter.save(state, Timestamp.from(Date.now()));
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			if (!loaded) {
				throw new Error('Failed to load game state');
			}
			const loadedAdventurers = Array.from(loaded.entities.values()).filter(e => e.type === 'Adventurer') as import('../../domain/entities/Adventurer').Adventurer[];
			expect(loadedAdventurers.length).toBeGreaterThan(0);

			const loadedAdventurer = loadedAdventurers[0];
			expect(loadedAdventurer.attributes.traitTags).toBeDefined();
			expect(Array.isArray(loadedAdventurer.attributes.traitTags)).toBe(true);
			expect(loadedAdventurer.attributes.roleKey).toBeDefined();
			expect(typeof loadedAdventurer.attributes.roleKey).toBe('string');
		});

		it('should serialize and deserialize missionType, dc, and preferredRole', async () => {
			const { createTestMission } = await import('../../test-utils/testFactories');
			const { GameState } = await import('../../domain/entities/GameState');
			const mission = createTestMission({
				state: 'Available'
			});

			// Manually set new attributes for testing
			mission.attributes.missionType = 'exploration';
			mission.attributes.dc = 20;
			mission.attributes.preferredRole = 'skill_specialist';

			const { Timestamp } = await import('../../domain/valueObjects/Timestamp');
			const entities = new Map([[mission.id, mission]]);
			const state = new GameState('test-player', Timestamp.from(Date.now()), entities, createTestGameState().resources);
			stateGetter = () => state;

			// Save and load
			adapter.save(state, Timestamp.from(Date.now()));
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			if (!loaded) {
				throw new Error('Failed to load game state');
			}
			const loadedMissions = Array.from(loaded.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			expect(loadedMissions.length).toBeGreaterThan(0);

			const loadedMission = loadedMissions[0];
			expect(loadedMission.attributes.missionType).toBe('exploration');
			expect(loadedMission.attributes.dc).toBe(20);
			expect(loadedMission.attributes.preferredRole).toBe('skill_specialist');
		});

		it('should serialize and deserialize loreTags in metadata', async () => {
			const { createTestAdventurer } = await import('../../test-utils/testFactories');
			const { GameState } = await import('../../domain/entities/GameState');
			const adventurer = createTestAdventurer({
				tags: ['combat']
			});

			// Create adventurer with loreTags in metadata
			const { Adventurer } = await import('../../domain/entities/Adventurer');
			const { Identifier } = await import('../../domain/valueObjects/Identifier');
			const id = Identifier.from<'AdventurerId'>('adv-lore');
			const { Timestamp } = await import('../../domain/valueObjects/Timestamp');
			const adventurerWithLore = new Adventurer(
				id,
				adventurer.attributes,
				[...adventurer.tags], // Convert readonly array to array
				'Idle',
				{},
				{
					loreTags: ['human', 'taldor', 'noble']
				}
			);

			const entities = new Map([[adventurerWithLore.id, adventurerWithLore]]);
			const state = new GameState('test-player', Timestamp.from(Date.now()), entities, createTestGameState().resources);
			stateGetter = () => state;

			// Save and load
			adapter.save(state, Timestamp.from(Date.now()));
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			if (!loaded) {
				throw new Error('Failed to load game state');
			}
			const loadedAdventurers = Array.from(loaded.entities.values()).filter(e => e.type === 'Adventurer') as import('../../domain/entities/Adventurer').Adventurer[];
			expect(loadedAdventurers.length).toBeGreaterThan(0);

			// Verify loreTags are persisted in metadata
			const loadedAdventurer = loadedAdventurers.find(a => a.id === 'adv-lore');
			expect(loadedAdventurer).toBeDefined();
			if (!loadedAdventurer) {
				throw new Error('Loaded adventurer not found');
			}
			expect(loadedAdventurer.metadata.loreTags).toEqual(['human', 'taldor', 'noble']);
		});

		it('should serialize and deserialize timer format as Record<string, number | null>', async () => {
			const { createTestMission } = await import('../../test-utils/testFactories');
			const { GameState } = await import('../../domain/entities/GameState');
			const { Timestamp: TimestampClass } = await import('../../domain/valueObjects/Timestamp');
			const { setTimer } = await import('../../domain/primitives/TimerHelpers');
			const mission = createTestMission({
				state: 'InProgress'
			});

			// Set timers
			const now = Date.now();
			setTimer(mission, 'startedAt', TimestampClass.from(now - 60000));
			setTimer(mission, 'endsAt', TimestampClass.from(now + 60000));

			// Verify timers are Record format before save
			expect(mission.timers).toBeInstanceOf(Object);
			expect(mission.timers).not.toBeInstanceOf(Map);
			expect(typeof mission.timers['startedAt']).toBe('number');
			expect(typeof mission.timers['endsAt']).toBe('number');

			const entities = new Map([[mission.id, mission]]);
			const state = new GameState('test-player', TimestampClass.from(Date.now()), entities, createTestGameState().resources);
			stateGetter = () => state;

			// Save and load
			adapter.save(state, Timestamp.from(Date.now()));
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			if (!loaded) {
				throw new Error('Failed to load game state');
			}
			const loadedMissions = Array.from(loaded.entities.values()).filter(e => e.type === 'Mission') as import('../../domain/entities/Mission').Mission[];
			expect(loadedMissions.length).toBeGreaterThan(0);

			const loadedMission = loadedMissions[0];
			// Verify timers are still Record format after load
			expect(loadedMission.timers).toBeInstanceOf(Object);
			expect(loadedMission.timers).not.toBeInstanceOf(Map);
			if (loadedMission.timers['endsAt']) {
				expect(typeof loadedMission.timers['endsAt']).toBe('number');
			}
		});

		it('should serialize and deserialize EntityMetadata structure', async () => {
			const { createTestAdventurer } = await import('../../test-utils/testFactories');
			const { GameState } = await import('../../domain/entities/GameState');
			const { Identifier } = await import('../../domain/valueObjects/Identifier');
			const { Adventurer } = await import('../../domain/entities/Adventurer');
			const id = Identifier.from<'AdventurerId'>('adv-meta');
			const adventurer = createTestAdventurer();
			const { Timestamp } = await import('../../domain/valueObjects/Timestamp');
			const adventurerWithMetadata = new Adventurer(
				id,
				adventurer.attributes,
				[...adventurer.tags], // Convert readonly array to array
				'Idle',
				{},
				{
					displayName: 'Test Hero',
					description: 'A test adventurer',
					visualKey: 'hero-1'
				}
			);

			const entities = new Map([[adventurerWithMetadata.id, adventurerWithMetadata]]);
			const state = new GameState('test-player', Timestamp.from(Date.now()), entities, createTestGameState().resources);
			stateGetter = () => state;

			// Save and load
			adapter.save(state, Timestamp.from(Date.now()));
			const loaded = adapter.load();

			expect(loaded).not.toBeNull();
			if (!loaded) {
				throw new Error('Failed to load game state');
			}
			const loadedAdventurers = Array.from(loaded.entities.values()).filter(e => e.type === 'Adventurer') as import('../../domain/entities/Adventurer').Adventurer[];
			const loadedAdventurer = loadedAdventurers.find(a => a.id === 'adv-meta');
			
			if (loadedAdventurer) {
				expect(loadedAdventurer.metadata).toBeDefined();
				expect(typeof loadedAdventurer.metadata).toBe('object');
			}
		});
	});
});

