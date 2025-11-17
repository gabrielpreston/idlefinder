/**
 * Handler Registration - wires all command handlers to the command bus
 * 
 * @deprecated This is legacy code using PlayerState. Use registerHandlersV2 from indexV2.ts instead.
 * This file is kept for backward compatibility but is not actively used.
 */

import type { BusManager } from '../bus/BusManager';
import type { CommandHandler } from '../bus/CommandBus';
import type { GameState } from '../domain/entities/GameState';
import { MissionSystem, AdventurerSystem, FacilitySystem } from '../domain/systems';
import { createStartMissionHandler } from './StartMissionHandler';
import { createRecruitAdventurerHandler } from './RecruitAdventurerHandler';
import { createUpgradeFacilityHandler } from './UpgradeFacilityHandler';
import { createCompleteMissionHandler } from './CompleteMissionHandler';

/**
 * Register all command handlers with the bus manager
 * @deprecated Use registerHandlersV2 instead
 */
export function registerHandlers(busManager: BusManager): void {
	const stateGetter = () => busManager.getState();

	// Create domain systems (pure - no bus dependencies)
	const missionSystem = new MissionSystem();
	const adventurerSystem = new AdventurerSystem();
	const facilitySystem = new FacilitySystem();

	// Register command handlers
	// Note: Casting to GameState handlers for type compatibility - these handlers use PlayerState internally
	// This is legacy code and should be replaced with V2 handlers
	busManager.commandBus.register('StartMission', createStartMissionHandler(missionSystem) as unknown as CommandHandler<import('../bus/types').StartMissionCommand, GameState>);
	busManager.commandBus.register(
		'RecruitAdventurer',
		createRecruitAdventurerHandler(adventurerSystem) as unknown as CommandHandler<import('../bus/types').RecruitAdventurerCommand, GameState>
	);
	busManager.commandBus.register(
		'UpgradeFacility',
		createUpgradeFacilityHandler(facilitySystem) as unknown as CommandHandler<import('../bus/types').UpgradeFacilityCommand, GameState>
	);
	busManager.commandBus.register(
		'CompleteMission',
		createCompleteMissionHandler(adventurerSystem) as unknown as CommandHandler<import('../bus/types').CompleteMissionCommand, GameState>
	);

	// Subscribe mission system to tick bus for automatic mission completion
	// Pass commandBus and stateGetter as parameters (not stored in MissionSystem)
	const tickHandler = missionSystem.createTickHandler(
		busManager.commandBus as unknown as import('../bus/CommandBus').CommandBus<import('../domain/entities/PlayerState').PlayerState>,
		stateGetter as unknown as () => import('../domain/entities/PlayerState').PlayerState
	);
	busManager.tickBus.subscribe(tickHandler);
}

