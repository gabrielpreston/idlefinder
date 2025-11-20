/**
 * Game Runtime Factory - Creates game runtime instance
 * 
 * Replaces singleton pattern with explicit factory function.
 * Runtime is passed via Svelte context to components.
 */

import { BusManager } from '../bus/BusManager';
import { RealTimeSource, type DomainTimeSource } from '../time/DomainTimeSource';
import { registerHandlers } from '../handlers/index';
import type { GameState } from '../domain/entities/GameState';
import { writable, type Readable } from 'svelte/store';
import { GameState as GameStateClass } from '../domain/entities/GameState';
import { handleFacilityUpgrade } from '../domain/systems/SlotSystem';

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
	
	// Register command handlers
	registerHandlers(busManager);
	
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
		busManager.domainEventBus.subscribe('FacilityUpgraded', (payload) => {
			// Handle slot creation on facility upgrade
			const event = payload as import('../domain/primitives/Event').FacilityUpgradedEvent;
			const currentState = busManager.getState();
			const now = ts.now();
			
			const slotsToCreate = handleFacilityUpgrade(event, currentState, now);
			
			if (slotsToCreate.length > 0) {
				// Add new slots to GameState
				const newEntities = new Map(currentState.entities);
				for (const slot of slotsToCreate) {
					newEntities.set(slot.id, slot);
				}
				
				const newState = new GameStateClass(
					currentState.playerId,
					currentState.lastPlayed,
					newEntities,
					currentState.resources
				);
				
				busManager.setState(newState);
			}
			
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('AdventurerGainedXP', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('AdventurerLeveledUp', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('ResourceSlotAssigned', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('ResourceSlotUnassigned', () => {
			set(busManager.getState());
		}),
		// Item events - update items store for EquipmentPanel
		busManager.domainEventBus.subscribe('ItemCreated', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('ItemEquipped', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('ItemUnequipped', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('ItemRepaired', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('ItemSalvaged', () => {
			set(busManager.getState());
		}),
		// Crafting events - update craftingQueue store for CraftingPanel
		busManager.domainEventBus.subscribe('CraftingStarted', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('CraftingCompleted', () => {
			set(busManager.getState());
		}),
		// Doctrine events - update missionDoctrine store for DoctrinePanel
		busManager.domainEventBus.subscribe('MissionDoctrineUpdated', () => {
			set(busManager.getState());
		}),
		// Mission events - update missions store
		busManager.domainEventBus.subscribe('MissionFailed', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('AdventurerAssigned', () => {
			set(busManager.getState());
		}),
		busManager.domainEventBus.subscribe('MissionAutoSelected', () => {
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

