/**
 * Mock Domain Systems - Mock factories for domain systems
 * Fast: Mock implementations, no real logic execution
 */

import { vi } from 'vitest';
import type { MissionSystem, AdventurerSystem, FacilitySystem } from '../domain/systems';
import type { PlayerState } from '../domain/entities/PlayerState';

/**
 * Create mock MissionSystem
 */
export function createMockMissionSystem(): Partial<MissionSystem> {
	return {
		startMission: vi.fn().mockImplementation((state: PlayerState) => ({
			...state,
			missions: [...state.missions]
		})),
		createTickHandler: vi.fn().mockReturnValue(async () => {})
	};
}

/**
 * Create mock AdventurerSystem
 */
export function createMockAdventurerSystem(): Partial<AdventurerSystem> {
	return {
		recruit: vi.fn().mockImplementation((state: PlayerState) => ({
			...state,
			adventurers: [...state.adventurers]
		})),
		applyExperience: vi.fn().mockImplementation((state: PlayerState) => ({
			...state,
			adventurers: [...state.adventurers]
		}))
	};
}

/**
 * Create mock FacilitySystem
 */
export function createMockFacilitySystem(): Partial<FacilitySystem> {
	return {
		upgrade: vi.fn().mockImplementation((state: PlayerState) => ({
			...state,
			facilities: { ...state.facilities }
		})),
		canUpgrade: vi.fn().mockReturnValue(true),
		getUpgradeCost: vi.fn().mockReturnValue({
			gold: 100,
			supplies: 10,
			relics: 0
		})
	};
}

