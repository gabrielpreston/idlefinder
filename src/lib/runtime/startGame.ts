/**
 * Game Runtime Factory - Creates game runtime instance
 * 
 * Replaces singleton pattern with explicit factory function.
 * Runtime is passed via Svelte context to components.
 */

import { BusManager } from '../bus/BusManager';
import { RealTimeSource, type DomainTimeSource } from '../time/DomainTimeSource';
import { registerHandlersV2 } from '../handlers/indexV2';
import type { GameState } from '../domain/entities/GameState';
import { writable, type Readable } from 'svelte/store';

/**
 * Game runtime interface - encapsulates all game systems
 */
export interface GameRuntime {
	readonly busManager: BusManager;
	readonly timeSource: DomainTimeSource;
	readonly gameState: Readable<GameState>;
	refreshGameState(): void;
	destroy(): void;
}

/**
 * Start game - creates runtime instance
 * 
 * @param initialState Initial game state
 * @param timeSource Optional time source (defaults to RealTimeSource)
 * @returns Game runtime instance
 */
export function startGame(
	initialState: GameState,
	timeSource?: DomainTimeSource
): GameRuntime {
	const ts = timeSource ?? new RealTimeSource();
	const busManager = new BusManager(initialState, ts);
	
	// Register command handlers (V2 - Actions-based)
	registerHandlersV2(busManager);
	
	// Create reactive gameState store
	const { subscribe, set } = writable<GameState>(initialState);
	
	// Set initial state
	set(initialState);
	
	// Subscribe to domain events to update store
	const unsubscribeFunctions = [
		busManager.domainEventBus.subscribe('ResourcesChanged', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('MissionStarted', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('MissionCompleted', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('AdventurerRecruited', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('FacilityUpgraded', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('AdventurerGainedXP', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('AdventurerLeveledUp', () => {
			set(busManager.getState());
		})
	];
	
	const gameState: Readable<GameState> = {
		subscribe
	};
	
	return {
		busManager,
		timeSource: ts,
		gameState,
		refreshGameState: () => {
			// Update store with current state (e.g., after loading saved state)
			set(busManager.getState());
		},
		destroy: () => {
			unsubscribeFunctions.forEach(fn => fn());
		}
	};
}

