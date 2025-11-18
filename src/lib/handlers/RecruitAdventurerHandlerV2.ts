/**
 * RecruitAdventurer command handler - Uses new Actions/Entities system
 * Creates new Adventurer entity and adds to GameState
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { RecruitAdventurerCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { Adventurer } from '../domain/entities/Adventurer';
import { Identifier } from '../domain/valueObjects/Identifier';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import type { AdventurerAttributes } from '../domain/attributes/AdventurerAttributes';
import { deriveRoleKey } from '../domain/attributes/RoleKey';
import {
	getRandomPathfinderClassKey,
	getRandomPathfinderAncestryKey
} from '../domain/data/pathfinder';

/**
 * Create RecruitAdventurer command handler using new entity system
 */
export function createRecruitAdventurerHandlerV2(): CommandHandler<RecruitAdventurerCommand, GameState> {
	return async function(
		payload: RecruitAdventurerCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validation: Check if name is provided
		if (!payload.name || payload.name.trim().length === 0) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RecruitAdventurer',
							reason: 'Adventurer name is required'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Generate adventurer ID
		const adventurerId = crypto.randomUUID();
		const id = Identifier.from<'AdventurerId'>(adventurerId);

		// Create default attributes for new adventurer (level 1, 0 XP)
		// Assign random Pathfinder class and ancestry
		const classKey = getRandomPathfinderClassKey();
		const ancestryKey = getRandomPathfinderAncestryKey();
		const attributes: AdventurerAttributes = {
			level: 1,
			xp: 0,
			abilityMods: NumericStatMap.fromMap(new Map([
				['str', 0],
				['dex', 0],
				['con', 0],
				['int', 0],
				['wis', 0],
				['cha', 0]
			])),
			classKey,
			ancestryKey,
			traitTags: payload.traits || [], // Use traits as traitTags
			roleKey: deriveRoleKey(classKey), // Derive from classKey
			baseHP: 10,
			assignedSlotId: null
		};

		// Create new Adventurer entity
		const adventurer = new Adventurer(
			id,
			attributes,
			payload.traits || [],
			'Idle', // Initial state
			{}, // No timers initially (Record, not Map)
			{ name: payload.name } // Store name in metadata
		);

		// Add adventurer to entities map
		const newEntities = new Map(state.entities);
		newEntities.set(adventurer.id, adventurer);

		// Create new GameState
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			newEntities,
			state.resources
		);

		// Emit AdventurerRecruited event
		const adventurerRecruitedEvent: DomainEvent = {
			type: 'AdventurerRecruited',
			payload: {
				adventurerId,
				name: payload.name,
				traits: payload.traits || []
			},
			timestamp: new Date().toISOString()
		};

		return {
			newState,
			events: [adventurerRecruitedEvent]
		};
	};
}

