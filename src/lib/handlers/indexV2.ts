/**
 * Handler Registration V2 - Uses Actions system
 * Registers handlers that use Actions instead of old systems
 */

import type { BusManager } from '../bus/BusManager';
import { IdleLoop } from '../domain/systems/IdleLoop';
import { createStartMissionHandlerV2 } from './StartMissionHandlerV2';
import { createUpgradeFacilityHandlerV2 } from './UpgradeFacilityHandlerV2';
import { createRecruitAdventurerHandlerV2 } from './RecruitAdventurerHandlerV2';
import { createEquipItemHandler } from './EquipItemHandler';
import { createUnequipItemHandler } from './UnequipItemHandler';
import { createRepairItemHandler } from './RepairItemHandler';
import { createSalvageItemHandler } from './SalvageItemHandler';
import { createUpdateAutoEquipRulesHandler } from './UpdateAutoEquipRulesHandler';
import { createTriggerAutoEquipHandler } from './TriggerAutoEquipHandler';
import { createUpdateMissionDoctrineHandler } from './UpdateMissionDoctrineHandler';
import { createAddCraftingToQueueHandler } from './AddCraftingToQueueHandler';
import { createCancelCraftingJobHandler } from './CancelCraftingJobHandler';
import { createAssignWorkerToSlotHandler } from './AssignWorkerToSlotHandler';
import { createUnassignWorkerFromSlotHandler } from './UnassignWorkerFromSlotHandler';
import type { TickHandler } from '../bus/TickBus';
import { Timestamp } from '../domain/valueObjects/Timestamp';
import type { DomainEvent } from '../bus/types';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';

/**
 * Create tick handler using IdleLoop
 */
function createIdleTickHandler(
	busManager: BusManager
): TickHandler {
	return async (deltaMs: number, timestamp: Date) => {
		const state = busManager.getState();
		const now = Timestamp.from(timestamp);

		// Store old resources to detect changes
		const oldResources = state.resources;

		// Process idle progression
		const idleLoop = new IdleLoop();
		const result = idleLoop.processIdleProgression(state, now);

		// Update state
		busManager.setState(result.newState);

		// Check if resources changed and emit ResourcesChanged event
		const newResources = result.newState.resources;
		const delta = ResourceBundle.calculateResourceDelta(oldResources, newResources);
		
		// Only emit if there's a change in any resource
		const hasChanges = delta.gold !== 0 || delta.fame !== 0 || delta.materials !== 0;
		
		if (hasChanges) {
			const resourcesChangedEvent: DomainEvent = {
				type: 'ResourcesChanged',
				payload: {
					delta,
					current: newResources.toResourceMap()
				},
				timestamp: timestamp.toISOString()
			};
			await busManager.domainEventBus.publish(resourcesChangedEvent);
		}

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
	
	// Register item command handlers
	busManager.commandBus.register('EquipItem', createEquipItemHandler());
	busManager.commandBus.register('UnequipItem', createUnequipItemHandler());
	busManager.commandBus.register('RepairItem', createRepairItemHandler());
	busManager.commandBus.register('SalvageItem', createSalvageItemHandler());
	
	// Register auto-equip command handlers
	busManager.commandBus.register('UpdateAutoEquipRules', createUpdateAutoEquipRulesHandler());
	busManager.commandBus.register('TriggerAutoEquip', createTriggerAutoEquipHandler());
	
	// Register doctrine command handlers
	busManager.commandBus.register('UpdateMissionDoctrine', createUpdateMissionDoctrineHandler());
	
	// Register crafting command handlers
	busManager.commandBus.register('AddCraftingToQueue', createAddCraftingToQueueHandler());
	busManager.commandBus.register('CancelCraftingJob', createCancelCraftingJobHandler());
	
	// Register slot assignment command handlers
	busManager.commandBus.register('AssignWorkerToSlot', createAssignWorkerToSlotHandler());
	busManager.commandBus.register('UnassignWorkerFromSlot', createUnassignWorkerFromSlotHandler());

	// Subscribe idle loop to tick bus
	const tickHandler = createIdleTickHandler(busManager);
	busManager.tickBus.subscribe(tickHandler);
}

