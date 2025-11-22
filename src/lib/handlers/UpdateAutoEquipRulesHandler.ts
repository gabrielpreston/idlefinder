/**
 * UpdateAutoEquipRules command handler
 * Updates the AutoEquipRules entity in GameState
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { UpdateAutoEquipRulesCommand, DomainEvent } from '../bus/types';
import { validateCommand } from '../bus/commandValidation';
import { GameState } from '../domain/entities/GameState';
import { AutoEquipRules } from '../domain/entities/AutoEquipRules';
import { Identifier } from '../domain/valueObjects/Identifier';
import type { RoleKey } from '../domain/attributes/RoleKey';
import type { StatPriority } from '../domain/attributes/AutoEquipRulesAttributes';

/**
 * Create UpdateAutoEquipRules command handler
 */
export function createUpdateAutoEquipRulesHandler(): CommandHandler<UpdateAutoEquipRulesCommand, GameState> {
	return function(
		payload: UpdateAutoEquipRulesCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('UpdateAutoEquipRules', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpdateAutoEquipRules',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as UpdateAutoEquipRulesCommand;

		// Find AutoEquipRules entity (should be singleton)
		let rulesEntity: AutoEquipRules | undefined;
		for (const entity of state.entities.values()) {
			if (entity.type === 'AutoEquipRules') {
				rulesEntity = entity as AutoEquipRules;
				break;
			}
		}

		// If no rules entity exists, create default one
		if (!rulesEntity) {
			const rulesId = Identifier.generate<'AutoEquipRulesId'>();
			rulesEntity = AutoEquipRules.createDefault(rulesId);
			state.entities.set(rulesEntity.id, rulesEntity);
		}

		// Update focus if provided
		if (validatedPayload.focus) {
			rulesEntity.updateFocus(validatedPayload.focus);
		}

		// Update allow rare auto-equip if provided
		if (validatedPayload.allowRareAutoEquip !== undefined) {
			rulesEntity.updateAllowRareAutoEquip(validatedPayload.allowRareAutoEquip);
		}

		// Update role priorities if provided
		if (validatedPayload.rolePriorities) {
			// Convert record to Map for compatibility
			const rolePrioritiesMap = new Map<string, string[]>();
			for (const [roleKey, priorities] of Object.entries(validatedPayload.rolePriorities)) {
				rolePrioritiesMap.set(roleKey, priorities as string[]);
			}
			for (const [roleKey, priorities] of rolePrioritiesMap.entries()) {
				rulesEntity.updateRolePriorities(roleKey as RoleKey, priorities as StatPriority[]);
			}
		}

		// Create new state with updated entities
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			state.entities,
			state.resources
		);

		return Promise.resolve({
			newState,
			events: [] // No events for config updates
		});
	};
}

