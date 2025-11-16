/**
 * Game Runtime Factory - Creates game runtime instance
 * 
 * Replaces singleton pattern with explicit factory function.
 * Runtime is passed via Svelte context to components.
 */

import { BusManager } from '../bus/BusManager';
import { RealTimeSource, type DomainTimeSource } from '../time/DomainTimeSource';
import { registerHandlers } from '../handlers';
import type { PlayerState } from '../domain/entities/PlayerState';
import { writable, type Readable } from 'svelte/store';

/**
 * Game runtime interface - encapsulates all game systems
 */
export interface GameRuntime {
	readonly busManager: BusManager;
	readonly timeSource: DomainTimeSource;
	readonly playerState: Readable<PlayerState>;
	refreshPlayerState(): void;
	destroy(): void;
}

/**
 * Start game - creates runtime instance
 * 
 * @param initialState Initial player state
 * @param timeSource Optional time source (defaults to RealTimeSource)
 * @returns Game runtime instance
 */
export function startGame(
	initialState: PlayerState,
	timeSource?: DomainTimeSource
): GameRuntime {
	const ts = timeSource ?? new RealTimeSource();
	const busManager = new BusManager(initialState, ts);
	
	// Register command handlers
	registerHandlers(busManager);
	
	// Create reactive playerState store
	const { subscribe, set } = writable<PlayerState>(initialState);
	
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
		})
	];
	
	const playerState: Readable<PlayerState> = {
		subscribe
	};
	
	return {
		busManager,
		timeSource: ts,
		playerState,
		refreshPlayerState: () => {
			// Update store with current state (e.g., after loading saved state)
			set(busManager.getState());
		},
		destroy: () => {
			unsubscribeFunctions.forEach(fn => fn());
		}
	};
}

