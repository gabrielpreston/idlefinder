/**
 * StartMission command handler - Uses Actions system
 * Per Systems Primitives Spec: Uses StartMissionAction
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { StartMissionCommand, DomainEvent } from '../bus/types';
import { GameState } from '../domain/entities/GameState';
import { StartMissionAction } from '../domain/actions/StartMissionAction';
import { applyEffects } from '../domain/primitives/Effect';
import type { RequirementContext } from '../domain/primitives/Requirement';

/**
 * Create StartMission command handler using Actions
 */
export function createStartMissionHandlerV2(): CommandHandler<StartMissionCommand, GameState> {
	return async function(
		payload: StartMissionCommand,
		state: GameState,
		context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// MVP: Single adventurer per mission
		if (payload.adventurerIds.length !== 1) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: 'MVP supports single adventurer per mission'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		const adventurerId = payload.adventurerIds[0];
		const now = context.currentTime;

		// Parse template ID from mission ID (format: templateId-timestamp-random)
		// Template IDs can contain hyphens (e.g., "explore-forest"), so we need to extract
		// everything except the last two parts (timestamp and random)
		let templateId = payload.missionId;
		if (payload.missionId.includes('-')) {
			const parts = payload.missionId.split('-');
			// Format is: templateId-timestamp-random
			// So templateId is everything except the last 2 parts
			if (parts.length >= 3) {
				templateId = parts.slice(0, -2).join('-');
			} else {
				// Fallback: if format doesn't match, use first part
				templateId = parts[0];
			}
		}

		// Mission template configuration (MVP: simple lookup)
		const missionTemplates: Record<string, { name: string; duration: number; rewards: { gold: number; xp: number } }> = {
			'explore-forest': { name: 'Explore Forest', duration: 60, rewards: { gold: 50, xp: 10 } },
			'clear-cave': { name: 'Clear Cave', duration: 120, rewards: { gold: 100, xp: 20 } },
			'rescue-villagers': { name: 'Rescue Villagers', duration: 180, rewards: { gold: 150, xp: 30 } }
		};

		const template = missionTemplates[templateId] || {
			name: `Mission ${templateId}`,
			duration: 60,
			rewards: { gold: 50, xp: 10 }
		};

		// Always create a new mission instance (unique IDs prevent duplicates)
		// Check if mission already exists (shouldn't happen with unique IDs, but safety check)
		if (state.entities.has(payload.missionId)) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: `Mission ${payload.missionId} already exists`
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Create mission entity from template
		const { Mission } = await import('../domain/entities/Mission');
		const { Identifier } = await import('../domain/valueObjects/Identifier');
		const { Duration } = await import('../domain/valueObjects/Duration');
		
		const missionId = Identifier.from<'MissionId'>(payload.missionId);
		const mission = new Mission(
			missionId,
			{
				missionType: 'combat', // Default mission type
				primaryAbility: 'str',
				dc: 10, // Easy difficulty DC
				difficultyTier: 'Easy',
				preferredRole: undefined, // No role preference by default
				baseDuration: Duration.ofSeconds(template.duration),
				baseRewards: template.rewards,
				maxPartySize: 1
			},
			[],
			'Available',
			{}, // timers (Record, not Map)
			{ name: template.name, templateId, missionId: payload.missionId }
		);
		
		const newEntities = new Map(state.entities);
		newEntities.set(mission.id, mission);
		const workingState = new GameState(
			state.playerId,
			state.lastPlayed,
			newEntities,
			state.resources
		);

		// Create requirement context
		const requirementContext: RequirementContext = {
			entities: workingState.entities,
			resources: workingState.resources,
			currentTime: now
		};

		// Execute action
		const action = new StartMissionAction(payload.missionId, adventurerId);
		const result = action.execute(requirementContext, {
			missionId: payload.missionId,
			adventurerId,
			startedAt: now
		});

		if (!result.success) {
			return {
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'StartMission',
							reason: result.error || 'Action execution failed'
						},
						timestamp: new Date().toISOString()
					}
				]
			};
		}

		// Apply effects
		const effectResult = applyEffects(result.effects, workingState.entities, workingState.resources);

		// Create new GameState
		const newState = new GameState(
			workingState.playerId,
			workingState.lastPlayed,
			effectResult.entities,
			effectResult.resources
		);

		// Generate events
		const events = action.generateEvents(
			effectResult.entities,
			effectResult.resources,
			result.effects,
			{ missionId: payload.missionId, adventurerId, startedAt: now }
		);

		return {
			newState,
			events
		};
	};
}

