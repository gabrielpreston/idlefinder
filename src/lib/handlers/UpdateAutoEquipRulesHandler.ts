/**
 * UpdateAutoEquipRules command handler
 * Updates the AutoEquipRules entity in GameState
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { UpdateAutoEquipRulesCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { AutoEquipRules } from '../domain/entities/AutoEquipRules';
import { Identifier } from '../domain/valueObjects/Identifier';
import type { RoleKey } from '../domain/attributes/RoleKey';
import type { StatPriority } from '../domain/attributes/AutoEquipRulesAttributes';

/**
 * Create UpdateAutoEquipRules command handler
 */
export function createUpdateAutoEquipRulesHandler(): CommandHandler<UpdateAutoEquipRulesCommand, GameState> {
	return async function(
		payload: UpdateAutoEquipRulesCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
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
		if (payload.focus) {
			rulesEntity.updateFocus(payload.focus);
		}

		// Update allow rare auto-equip if provided
		if (payload.allowRareAutoEquip !== undefined) {
			rulesEntity.updateAllowRareAutoEquip(payload.allowRareAutoEquip);
		}

		// Update role priorities if provided
		if (payload.rolePriorities) {
			for (const [roleKey, priorities] of payload.rolePriorities.entries()) {
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

		return {
			newState,
			events: [] // No events for config updates
		};
	};
}

