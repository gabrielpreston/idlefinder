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
import { getEntityAs, isFacility } from '../domain/primitives/EntityTypeGuards';
import { validateCommand } from '../bus/commandValidation';

/**
 * Create UpgradeFacility command handler using Actions
 */
export function createUpgradeFacilityHandler(): CommandHandler<UpgradeFacilityCommand, GameState> {
	return function(
		payload: UpgradeFacilityCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('UpgradeFacility', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UpgradeFacility',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as UpgradeFacilityCommand;

		// payload.facility can be either a facility ID or facilityType (for MVP compatibility)
		// Try to find by ID first, then by type
		let facility = getEntityAs(state.entities, validatedPayload.facility, isFacility);
		
		if (!facility) {
			// Fallback: find by facilityType
			const facilities = Array.from(state.entities.values())
				.filter(isFacility)
				.filter((f) => f.attributes.facilityType === validatedPayload.facility);
			
			if (facilities.length === 0) {
				return Promise.resolve({
					newState: state,
					events: [
						{
							type: 'CommandFailed',
							payload: {
								commandType: 'UpgradeFacility',
								reason: `Facility ${validatedPayload.facility} not found`
							},
							timestamp: new Date().toISOString()
						}
					]
				});
			}
			
			facility = facilities[0];
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
			return Promise.resolve({
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
			});
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
			{},
			context.currentTime
		);

		return Promise.resolve({
			newState,
			events
		});
	};
}

