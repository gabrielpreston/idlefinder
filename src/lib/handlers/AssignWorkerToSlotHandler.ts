/**
 * AssignWorkerToSlot command handler
 * Assigns a worker (player or adventurer) to a resource slot
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { AssignWorkerToSlotCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { ResourceSlot } from '../domain/entities/ResourceSlot';
import { Adventurer } from '../domain/entities/Adventurer';
import { Identifier } from '../domain/valueObjects/Identifier';

/**
 * Create AssignWorkerToSlot command handler
 */
export function createAssignWorkerToSlotHandler(): CommandHandler<AssignWorkerToSlotCommand, GameState> {
	return async function(
		payload: AssignWorkerToSlotCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate slot exists
		const slot = state.entities.get(payload.slotId) as ResourceSlot | undefined;
		if (!slot || slot.type !== 'ResourceSlot') {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'AssignWorkerToSlot',
							reason: `Slot ${payload.slotId} not found`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Validate slot state
		if (slot.state !== 'available' && slot.state !== 'occupied') {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'AssignWorkerToSlot',
							reason: `Cannot assign worker: slot state is ${slot.state}`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// If assigning adventurer, validate adventurer exists and is Idle
		if (payload.assigneeType === 'adventurer') {
			if (!payload.assigneeId) {
				return {
					newState: state,
					events: [
						{
							type: 'CommandFailed',
							payload: {
								commandType: 'AssignWorkerToSlot',
								reason: 'assigneeId is required when assigneeType is adventurer'
							},
							timestamp: new Date().toISOString()
						}
					]
				};
			}

			const adventurer = state.entities.get(payload.assigneeId) as Adventurer | undefined;
			if (!adventurer || adventurer.type !== 'Adventurer') {
				return {
					newState: state,
					events: [
						{
							type: 'CommandFailed',
							payload: {
								commandType: 'AssignWorkerToSlot',
								reason: `Adventurer ${payload.assigneeId} not found`
							},
							timestamp: new Date().toISOString()
						}
					]
				};
			}

			if (adventurer.state !== 'Idle') {
				return {
					newState: state,
					events: [
						{
							type: 'CommandFailed',
							payload: {
								commandType: 'AssignWorkerToSlot',
								reason: `Cannot assign adventurer: adventurer state is ${adventurer.state}`
							},
							timestamp: new Date().toISOString()
						}
					]
				};
			}

			// Assign adventurer to slot
			const slotId = Identifier.from<'SlotId'>(payload.slotId);
			adventurer.assignToSlot(slotId);
		}

		// Update slot assignment
		slot.assignWorker(payload.assigneeType, payload.assigneeId || null);
		
		// Reset lastTickAt timer to current time when assigning worker
		// This ensures generation starts fresh from assignment time, not from previous assignment
		slot.timers['lastTickAt'] = context.currentTime.value;

		// Create new GameState with updated entities
		const newEntities = new Map(state.entities);
		newEntities.set(slot.id, slot);
		if (payload.assigneeType === 'adventurer' && payload.assigneeId) {
			const adventurer = newEntities.get(payload.assigneeId) as Adventurer;
			if (adventurer) {
				newEntities.set(adventurer.id, adventurer);
			}
		}

		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			newEntities,
			state.resources
		);

		// Emit ResourceSlotAssigned event
		const event: DomainEvent = {
			type: 'ResourceSlotAssigned',
			payload: {
				slotId: payload.slotId,
				assigneeType: payload.assigneeType,
				assigneeId: payload.assigneeId || null
			},
			timestamp: new Date().toISOString()
		};

		return {
			newState,
			events: [event]
		};
	};
}

