/**
 * RecruitAdventurer command handler
 * Matches design spec: docs/design/04-api-message-spec.md lines 59-67, 106-116
 */

import type { CommandHandler } from '../bus/CommandBus';
import type { RecruitAdventurerCommand, DomainEvent } from '../bus/types';
import type { PlayerState } from '../domain/entities/PlayerState';
import { AdventurerSystem } from '../domain/systems';
// Generate unique ID - using crypto.randomUUID() which is available in modern browsers

/**
 * Create RecruitAdventurer command handler
 */
export function createRecruitAdventurerHandler(
	adventurerSystem: AdventurerSystem
): CommandHandler<RecruitAdventurerCommand, PlayerState> {
	return async (
		payload: RecruitAdventurerCommand,
		state: PlayerState
	): Promise<{ newState: PlayerState; events: DomainEvent[] }> => {
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

		// Recruit adventurer
		const newState = adventurerSystem.recruit(
			state,
			adventurerId,
			payload.name,
			payload.traits || []
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

