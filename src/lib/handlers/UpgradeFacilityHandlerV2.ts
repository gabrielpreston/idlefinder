/**
 * UpgradeFacility command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses UpgradeFacilityAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { UpgradeFacilityCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { UpgradeFacilityAction } from '../domain/actions/UpgradeFacilityAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';

/**
 * Create UpgradeFacility command handler using Actions
 */
export function createUpgradeFacilityHandlerV2(): CommandHandler<UpgradeFacilityCommand, GameState> {
	return async function(
		payload: UpgradeFacilityCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// payload.facility can be either a facility ID or facilityType (for MVP compatibility)
		// Try to find by ID first, then by type
		let facility = state.entities.get(payload.facility) as import('../domain/entities/Facility').Facility | undefined;
		
		if (!facility || facility.type !== 'Facility') {
			// Fallback: find by facilityType
			const facilities = Array.from(state.entities.values()).filter(
				(e) => {
					if (e.type !== 'Facility') return false;
					const f = e as import('../domain/entities/Facility').Facility;
					return f.attributes.facilityType === payload.facility;
				}
			);
			
			if (facilities.length === 0) {
				return {
					newState: state,
					events: [
						{
							type: 'CommandFailed',
							payload: {
								commandType: 'UpgradeFacility',
								reason: `Facility ${payload.facility} not found`
							},
							timestamp: new Date().toISOString()
						}
					]
				};
			}
			
			facility = facilities[0] as import('../domain/entities/Facility').Facility;
		}

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: state.entities,
			resources: state.resources,
			currentTime: context.currentTime
		};

		// Execute action
		const action = new UpgradeFacilityAction(facility.id);
		const result = action.execute(requirementContext, {});

		if (!result.success) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpgradeFacility',
							reason: result.error || 'Action execution failed'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Apply effects
		const effectResult = applyEffects(result.effects, state.entities, state.resources);

		// Create new GameState
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			effectResult.entities,
			effectResult.resources
		);

		// Generate events
		const events = action.generateEvents(
			effectResult.entities,
			effectResult.resources,
			result.effects,
			{}
		);

		return {
			newState,
			events
		};
	};
}

