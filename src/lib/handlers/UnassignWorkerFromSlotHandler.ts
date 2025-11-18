/**
 * UnassignWorkerFromSlot command handler
 * Unassigns a worker from a resource slot
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { UnassignWorkerFromSlotCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { ResourceSlot } from '../domain/entities/ResourceSlot';
import { Adventurer } from '../domain/entities/Adventurer';

/**
 * Create UnassignWorkerFromSlot command handler
 */
export function createUnassignWorkerFromSlotHandler(): CommandHandler<UnassignWorkerFromSlotCommand, GameState> {
	return async function(
		payload: UnassignWorkerFromSlotCommand,
		state: GameState,
		_context: CommandHandlerContext
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
							commandType: 'UnassignWorkerFromSlot',
							reason: `Slot ${payload.slotId} not found`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Validate slot has assignee
		if (slot.attributes.assigneeType === 'none') {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UnassignWorkerFromSlot',
							reason: 'Slot has no assigned worker'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Validate slot state is occupied
		if (slot.state !== 'occupied') {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'UnassignWorkerFromSlot',
							reason: `Cannot unassign worker from slot: slot state is ${slot.state}`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Store assignee info for event
		const assigneeType = slot.attributes.assigneeType;
		const assigneeId = slot.attributes.assigneeId;

		// If unassigning adventurer, update adventurer state
		if (assigneeType === 'adventurer' && assigneeId) {
			const adventurer = state.entities.get(assigneeId) as Adventurer | undefined;
			if (adventurer && adventurer.type === 'Adventurer') {
				adventurer.unassignFromSlot();
			}
		}

		// Unassign from slot
		slot.unassignWorker();
		
		// Clear lastTickAt timer when unassigning
		// Since unassigned slots don't generate resources, there's no need to keep the timer
		slot.timers['lastTickAt'] = null;

		// Create new GameState with updated entities
		const newEntities = new Map(state.entities);
		newEntities.set(slot.id, slot);
		if (assigneeType === 'adventurer' && assigneeId) {
			const adventurer = newEntities.get(assigneeId) as Adventurer;
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

		// Emit ResourceSlotUnassigned event
		const event: DomainEvent = {
			type: 'ResourceSlotUnassigned',
			payload: {
				slotId: payload.slotId,
				assigneeType,
				assigneeId
			},
			timestamp: new Date().toISOString()
		};

		return {
			newState,
			events: [event]
		};
	};
}

