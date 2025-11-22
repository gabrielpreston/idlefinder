/**
 * TriggerAutoEquip command handler
 * Manually triggers auto-equip for one or all adventurers
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { TriggerAutoEquipCommand, DomainEvent } from '../bus/types';
import { validateCommand } from '../bus/commandValidation';
import { GameState } from '../domain/entities/GameState';
import { autoEquip } from '../domain/systems/AutoEquipSystem';
import { applyEffects } from '../domain/primitives/Effect';
import { AutoEquipRules } from '../domain/entities/AutoEquipRules';
import type { Adventurer } from '../domain/entities/Adventurer';
import type { Item } from '../domain/entities/Item';

/**
 * Create TriggerAutoEquip command handler
 */
export function createTriggerAutoEquipHandler(): CommandHandler<TriggerAutoEquipCommand, GameState> {
	return async function(
		payload: TriggerAutoEquipCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('TriggerAutoEquip', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'TriggerAutoEquip',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as TriggerAutoEquipCommand;

		// Find AutoEquipRules entity
		let rulesEntity: AutoEquipRules | undefined;
		for (const entity of state.entities.values()) {
			if (entity.type === 'AutoEquipRules') {
				rulesEntity = entity as AutoEquipRules;
				break;
			}
		}

		if (!rulesEntity) {
			// Create default rules if none exist
			const { Identifier } = await import('../domain/valueObjects/Identifier');
			const rulesId = Identifier.generate<'AutoEquipRulesId'>();
			rulesEntity = AutoEquipRules.createDefault(rulesId);
			state.entities.set(rulesEntity.id, rulesEntity);
		}

		// Get all available items (InArmory state)
		const availableItems = Array.from(state.entities.values())
			.filter((e) => e.type === 'Item' && (e as Item).state === 'InArmory')
			.map((e) => e as Item);

		// Get adventurers to equip
		const adventurersToEquip = validatedPayload.adventurerId
			? [state.entities.get(validatedPayload.adventurerId) as Adventurer].filter(Boolean)
			: Array.from(state.entities.values())
				.filter((e) => e.type === 'Adventurer')
				.map((e) => e as Adventurer);

		// Run auto-equip for each adventurer
		const allActions: Array<import('../domain/actions/EquipItemAction').EquipItemAction> = [];
		for (const adventurer of adventurersToEquip) {
			const actions = autoEquip(adventurer, availableItems, rulesEntity);
			allActions.push(...actions);
		}

		// Execute all equip actions
		let currentEntities = state.entities;
		let currentResources = state.resources;
		const allEvents: DomainEvent[] = [];

		for (const action of allActions) {
			const requirementContext = {
				entities: currentEntities,
				resources: currentResources,
				currentTime: context.currentTime
			};

			const actionResult = action.execute(requirementContext, {
				itemId: action['itemId'],
				adventurerId: action['adventurerId'],
				slot: action['slot']
			});

			if (actionResult.success) {
				const effectResult = applyEffects(actionResult.effects, currentEntities, currentResources);
				currentEntities = effectResult.entities;
				currentResources = effectResult.resources;

				const events = action.generateEvents(
					effectResult.entities,
					effectResult.resources,
					actionResult.effects,
					{
						itemId: action['itemId'],
						adventurerId: action['adventurerId'],
						slot: action['slot']
					},
					context.currentTime
				);
				allEvents.push(...events);
			}
		}

		// Create new state with updated entities
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			currentEntities,
			currentResources
		);

		return Promise.resolve({
			newState,
			events: allEvents
		});
	};
}

