/**
 * Handler Registration V2 - Uses Actions system
 * Registers handlers that use Actions instead of old systems
 */

import type { BusManager } from '../bus/BusManager';
import { IdleLoop } from '../domain/systems/IdleLoop';
import { createStartMissionHandlerV2 } from './StartMissionHandlerV2';
import { createUpgradeFacilityHandlerV2 } from './UpgradeFacilityHandlerV2';
import { createRecruitAdventurerHandlerV2 } from './RecruitAdventurerHandlerV2';
import type { TickHandler } from '../bus/TickBus';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import type { DomainEvent } from '../bus/types';

/**
 * Create tick handler using IdleLoop
 */
function createIdleTickHandler(
	busManager: BusManager
): TickHandler {
	return async (deltaMs: number, timestamp: Date) => {
		const state = busManager.getState();
		const now = Timestamp.from(timestamp);

		// Process idle progression
		const idleLoop = new IdleLoop();
		const result = idleLoop.processIdleProgression(state, now);

		// Update state
		busManager.setState(result.newState);

		// Publish events
		for (const event of result.events) {
			await busManager.domainEventBus.publish(event as DomainEvent);
		}
	};
}

/**
 * Register all command handlers with the bus manager (V2 - Actions-based)
 */
export function registerHandlersV2(busManager: BusManager): void {
	// Register command handlers using Actions/Entities
	busManager.commandBus.register('StartMission', createStartMissionHandlerV2());
	busManager.commandBus.register('UpgradeFacility', createUpgradeFacilityHandlerV2());
	busManager.commandBus.register('RecruitAdventurer', createRecruitAdventurerHandlerV2());

	// Subscribe idle loop to tick bus
	const tickHandler = createIdleTickHandler(busManager);
	busManager.tickBus.subscribe(tickHandler);
}

