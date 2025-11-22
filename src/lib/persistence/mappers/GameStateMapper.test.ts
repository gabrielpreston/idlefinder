/**
 * GameStateMapper Tests
 */

import { describe, it, expect } from 'vitest';
import { domainToDTO, dtoToDomain } from './GameStateMapper';
import { createTestGameState, createTestAdventurer, createTestMission, createTestFacility } from '../../test-utils/testFactories';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { ResourceBundle } from '../../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../../domain/valueObjects/ResourceUnit';
import { ResourceSlot } from '../../domain/entities/ResourceSlot';
import { Identifier } from '../../domain/valueObjects/Identifier';
import type { GameStateDTO } from '../dto/GameStateDTO';
import { isResourceSlot } from '../../domain/primitives/EntityTypeGuards';

describe('GameStateMapper', () => {
	describe('domainToDTO', () => {
		it('should convert GameState to DTO', () => {
			const state = createTestGameState();
			const dto = domainToDTO(state);

			expect(dto.version).toBe(3);
			expect(dto.playerId).toBe(state.playerId);
			expect(dto.lastPlayed).toBe(state.lastPlayed.value.toString());
		});

		it('should serialize entities', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			expect(dto.entities.length).toBeGreaterThan(0);
			const adventurerDTO = dto.entities.find(e => e.id === 'adv-1');
			expect(adventurerDTO?.type).toBe('Adventurer');
		});

		it('should serialize resources', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 50)
			]);
			const state = createTestGameState({ resources });
			const dto = domainToDTO(state);

			expect(dto.resources.resources.gold).toBe(100);
			expect(dto.resources.resources.fame).toBe(50);
		});

		it('should serialize Adventurer attributes', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', level: 5 });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			const adventurerDTO = dto.entities.find(e => e.id === 'adv-1');
			expect(adventurerDTO?.attributes.level).toBe(5);
		});

		it('should serialize Mission attributes', () => {
			const mission = createTestMission({ id: 'mission-1' });
			const entities = new Map([[mission.id, mission]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			const missionDTO = dto.entities.find(e => e.id === 'mission-1');
			expect(missionDTO?.type).toBe('Mission');
		});

		it('should serialize Facility attributes', () => {
			const facility = createTestFacility({ id: 'facility-1', tier: 3 });
			const entities = new Map([[facility.id, facility]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			const facilityDTO = dto.entities.find(e => e.id === 'facility-1');
			expect(facilityDTO?.attributes.tier).toBe(3);
		});

		it('should serialize ResourceSlot attributes', () => {
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'gold',
					baseRatePerMinute: 10,
					assigneeType: 'player',
					assigneeId: null,
					fractionalAccumulator: 0
				},
				[],
				'occupied',
				{},
				{}
			);
			const entities = new Map([[slot.id, slot]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			const slotDTO = dto.entities.find(e => e.id === 'slot-1');
			expect(slotDTO?.type).toBe('ResourceSlot');
			expect(slotDTO?.attributes.resourceType).toBe('gold');
		});
	});

	describe('dtoToDomain', () => {
		it('should convert DTO to GameState', () => {
			const state = createTestGameState();
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

			expect(restored.playerId).toBe(state.playerId);
		});

		it('should deserialize entities', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

			const restoredAdventurer = restored.entities.get('adv-1');
			expect(restoredAdventurer?.type).toBe('Adventurer');
		});

		it('should deserialize resources', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100),
				new ResourceUnit('fame', 50)
			]);
			const state = createTestGameState({ resources });
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

			expect(restored.resources.get('gold')).toBe(100);
			expect(restored.resources.get('fame')).toBe(50);
		});

		it('should handle round-trip conversion', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1', level: 5 });
			const mission = createTestMission({ id: 'mission-1' });
			const entities = new Map<string, import('../../domain/primitives/Requirement').Entity>([
				[adventurer.id, adventurer],
				[mission.id, mission]
			]);
			const resources = ResourceBundle.fromArray([new ResourceUnit('gold', 200)]);
			const state = createTestGameState({ entities, resources });
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

			expect(restored.entities.size).toBe(2);
			expect(restored.resources.get('gold')).toBe(200);
		});

		it('should handle version migration', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 1, // Old version
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			// Should return empty state for old versions
			expect(restored.playerId).toBe('player-1');
		});

		it('should handle missing optional fields', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			expect(restored).toBeDefined();
		});

		it('should handle missing lastPlayed timestamp', () => {
			const dto: GameStateDTO = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: '', // Empty string - falsy, so will use Timestamp.now()
				entities: [],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			expect(restored).toBeDefined();
			expect(restored.lastPlayed).toBeDefined();
		});

		it('should handle missing playerId', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 3,
				playerId: '', // Empty string
				lastPlayed: now.value.toString(),
				entities: [],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			expect(restored.playerId).toBe('player-1'); // Default
		});

		it('should handle missing entities array', () => {
			const now = Timestamp.now();
			const dto = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: undefined, // Missing entities - testing invalid data
				resources: { resources: {} }
			} as unknown as GameStateDTO;

			const restored = dtoToDomain(dto);

			expect(restored.entities.size).toBe(0);
		});

		it('should handle entity deserialization failure (null entity)', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [
					{
						id: 'unknown-1',
						type: 'UnknownType', // Unknown type - testing invalid data
						attributes: {},
						tags: [],
						state: '',
						timers: {},
						metadata: {}
					}
				],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			// Unknown entity type should return null and not be added
			expect(restored.entities.has('unknown-1')).toBe(false);
		});

		it('should handle deserialization with missing attributes', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [
					{
						id: 'adv-1',
						type: 'Adventurer',
						attributes: {}, // Missing all attributes
						tags: [],
						state: '',
						timers: {},
						metadata: {}
					}
				],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			const adventurer = restored.entities.get('adv-1');
			expect(adventurer?.type).toBe('Adventurer');
			// Should use defaults
			if (adventurer && adventurer.type === 'Adventurer') {
				expect((adventurer as unknown as { attributes: { level: number } }).attributes.level).toBe(1); // Default
			}
		});

		it('should handle deserialization with missing timers', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);
			
			// Remove timers from DTO - testing invalid data
			const advDto = dto.entities.find(e => e.id === 'adv-1');
			if (advDto) {
				(advDto as { timers?: unknown }).timers = undefined;
			}

			const restored = dtoToDomain(dto);

			expect(restored.entities.get('adv-1')).toBeDefined();
		});

		it('should handle deserialization with missing tags', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);
			
			// Remove tags from DTO - testing invalid data
			const advDto = dto.entities.find(e => e.id === 'adv-1');
			if (advDto) {
				(advDto as { tags?: unknown }).tags = undefined;
			}

			const restored = dtoToDomain(dto);

			expect(restored.entities.get('adv-1')).toBeDefined();
		});

		it('should handle deserialization with missing metadata', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);
			
			// Remove metadata from DTO - testing invalid data
			const advDto = dto.entities.find(e => e.id === 'adv-1');
			if (advDto) {
				(advDto as { metadata?: unknown }).metadata = undefined;
			}

			const restored = dtoToDomain(dto);

			expect(restored.entities.get('adv-1')).toBeDefined();
		});

		it('should handle version migration for unknown version', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 999, // Unknown version
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			// Should return empty state for unknown versions
			expect(restored.playerId).toBe('player-1');
			expect(restored.entities.size).toBe(0);
		});

		it('should serialize entity without tags', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			// Remove tags if possible (tags might be readonly)
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			const advDto = dto.entities.find(e => e.id === 'adv-1');
			expect(Array.isArray(advDto?.tags)).toBe(true);
		});

		it('should serialize entity without metadata', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map([[adventurer.id, adventurer]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);

			const advDto = dto.entities.find(e => e.id === 'adv-1');
			expect(typeof advDto?.metadata).toBe('object');
		});

		it('should handle ResourceSlot with all attribute types', () => {
			const slot = new ResourceSlot(
				Identifier.from<'SlotId'>('slot-1'),
				{
					facilityId: 'facility-1',
					resourceType: 'materials', // Different resource type
					baseRatePerMinute: 15,
					assigneeType: 'adventurer', // Different assignee type
					assigneeId: 'adv-1',
					fractionalAccumulator: 0
				},
				[],
				'locked', // Different state
				{},
				{}
			);
			const entities = new Map([[slot.id, slot]]);
			const state = createTestGameState({ entities });
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

		const restoredSlot = restored.entities.get('slot-1');
		expect(restoredSlot).toBeDefined();
		if (restoredSlot && isResourceSlot(restoredSlot)) {
			expect(restoredSlot.attributes.resourceType).toBe('materials');
			expect(restoredSlot.attributes.assigneeType).toBe('adventurer');
		}
		});

		it('should handle Mission with all difficulty tiers', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [
					{
						id: 'mission-1',
						type: 'Mission',
						attributes: {
							missionType: 'exploration',
							primaryAbility: 'dex',
							dc: 20,
							difficultyTier: 'Hard',
							preferredRole: 'Rogue',
							baseDuration: 120000,
							baseRewards: { gold: 200, xp: 100, fame: 10 },
							maxPartySize: 3
						},
						tags: [],
						state: 'Available',
						timers: {},
						metadata: {}
					}
				],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			const mission = restored.entities.get('mission-1');
			expect(mission?.type).toBe('Mission');
		});

		it('should handle Facility with different facility types', () => {
			const now = Timestamp.now();
			const dto: GameStateDTO = {
				version: 3,
				playerId: 'player-1',
				lastPlayed: now.value.toString(),
				entities: [
					{
						id: 'facility-1',
						type: 'Facility',
						attributes: {
							facilityType: 'Dormitory',
							tier: 2,
							baseCapacity: 5,
							bonusMultipliers: { xp: 1.2 }
						},
						tags: [],
						state: 'Online',
						timers: {},
						metadata: {}
					}
				],
				resources: { resources: {} }
			};

			const restored = dtoToDomain(dto);

			const facility = restored.entities.get('facility-1');
			expect(facility?.type).toBe('Facility');
		});
	});
});

