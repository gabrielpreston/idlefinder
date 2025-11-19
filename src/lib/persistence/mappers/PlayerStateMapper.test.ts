/**
 * PlayerStateMapper Tests (Deprecated - kept for migration support)
 */

import { describe, it, expect } from 'vitest';
import { domainToDTO, dtoToDomain } from './PlayerStateMapper';
import type { PlayerStateDTO } from '../dto/PlayerStateDTO';
import type { PlayerState } from '../../domain/entities/PlayerState';

function createTestPlayerState(): PlayerState {
	return {
		playerId: 'player-1',
		lastPlayed: new Date().toISOString(),
		resources: {
			gold: 100,
			fame: 50,
			materials: 25
		},
		adventurers: [
			{
				id: 'adv-1',
				name: 'Test Adventurer',
				level: 5,
				experience: 100,
				traits: ['brave'],
				status: 'idle',
				assignedMissionId: null
			}
		],
		missions: [],
		facilities: {
			tavern: { level: 1, effects: [] },
			guildHall: { level: 2, effects: [] },
			blacksmith: { level: 1, effects: [] }
		},
		fame: 50,
		completedMissionIds: []
	};
}

describe('PlayerStateMapper', () => {
	describe('domainToDTO', () => {
		it('should convert PlayerState to DTO', () => {
			const state = createTestPlayerState();
			const dto = domainToDTO(state);

			expect(dto.version).toBe(1);
			expect(dto.playerId).toBe('player-1');
			expect(dto.resources.gold).toBe(100);
		});

		it('should serialize adventurers', () => {
			const state = createTestPlayerState();
			const dto = domainToDTO(state);

			expect(dto.adventurers).toHaveLength(1);
			expect(dto.adventurers[0].name).toBe('Test Adventurer');
		});

		it('should serialize facilities', () => {
			const state = createTestPlayerState();
			const dto = domainToDTO(state);

			expect(dto.facilities.guildHall.level).toBe(2);
		});
	});

	describe('dtoToDomain', () => {
		it('should convert DTO to PlayerState', () => {
			const state = createTestPlayerState();
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

			expect(restored.playerId).toBe('player-1');
			expect(restored.resources.gold).toBe(100);
		});

		it('should handle round-trip conversion', () => {
			const state = createTestPlayerState();
			const dto = domainToDTO(state);
			const restored = dtoToDomain(dto);

			expect(restored.adventurers).toHaveLength(1);
			expect(restored.adventurers[0].name).toBe('Test Adventurer');
		});

		it('should handle missing optional fields', () => {
			const dto: Partial<PlayerStateDTO> = {
				version: 1,
				playerId: 'player-1'
			};

			const restored = dtoToDomain(dto as PlayerStateDTO);

			expect(restored.resources.gold).toBe(0);
			expect(restored.adventurers).toHaveLength(0);
		});

		it('should handle version migration', () => {
			const dto: PlayerStateDTO = {
				version: 0, // Old version
				playerId: 'player-1',
				lastPlayed: new Date().toISOString(),
				resources: { gold: 100, fame: 0, materials: 0 },
				adventurers: [],
				missions: [],
				facilities: {
					tavern: { level: 1, effects: [] },
					guildHall: { level: 1, effects: [] },
					blacksmith: { level: 1, effects: [] }
				},
				fame: 0,
				completedMissionIds: []
			};

			const restored = dtoToDomain(dto);

			expect(restored).toBeDefined();
		});

		it('should throw error for invalid DTO', () => {
			expect(() => dtoToDomain(null as any)).toThrow('Invalid DTO: not an object');
		});
	});
});

