/**
 * Idle Loop System - Pure function for idle progression
 * Per Systems Primitives Spec line 123:
 * "The idle loop is pure: given (previousState, timers, now) it computes a new (state, timers) via Effects."
 */

import { GameState } from '../entities/GameState';
import type { Timestamp } from '../valueObjects/Timestamp';
import type { Mission } from '../entities/Mission';
import { ResolveMissionAction } from '../actions/ResolveMissionAction';
import { applyEffects } from '../primitives/Effect';
import type { RequirementContext } from '../primitives/Requirement';
import type { DomainEvent } from '../primitives/Event';
import { getTimer } from '../primitives/TimerHelpers';
import { automateMissionSelection } from './MissionAutomationSystem';
import { processCraftingQueue } from './CraftingSystem';

/**
 * Idle Loop Result - new state and events from idle progression
 */
export interface IdleLoopResult {
	newState: GameState;
	events: DomainEvent[];
}

/**
 * Idle Loop System - Pure function for idle progression
 * Per spec: computes new state from previousState, timers, and current time
 */
export class IdleLoop {
	/**
	 * Process idle progression for a given time
	 * Pure function: given (previousState, timers, now) computes new (state, timers) via Effects
	 */
	processIdleProgression(
		previousState: GameState,
		now: Timestamp
	): IdleLoopResult {
		// Create a copy of entities map for mutation
		const entities = new Map(previousState.entities);
		let resources = previousState.resources;
		const events: DomainEvent[] = [];

		// Find missions that are ready for resolution
		const missions = Array.from(entities.values()).filter(
			(e) => e.type === 'Mission'
		) as Mission[];

		for (const mission of missions) {
			if (mission.state === 'InProgress') {
				const endsAt = getTimer(mission, 'endsAt');
				if (endsAt && now.value >= endsAt.value) {
					// Mission is ready for resolution
					try {
						// Create requirement context
						const context: RequirementContext = {
							entities,
							resources,
							currentTime: now
						};

						// Execute ResolveMissionAction
						const action = new ResolveMissionAction(mission.id);
						const result = action.execute(context, {
							missionId: mission.id,
							resolvedAt: now
						});

						if (result.success) {
							// Apply effects (mutates entities and resources in place)
							const effectResult = applyEffects(result.effects, entities, resources);
							// Note: applyEffects mutates entities map in place, so we don't need to rebuild it
							resources = effectResult.resources;

							// Generate events (after effects applied)
							const actionEvents = action.generateEvents(
								entities,
								resources,
								result.effects,
								{ missionId: mission.id, resolvedAt: now }
							);
							events.push(...actionEvents);
						}
					} catch (error) {
						console.error(`[IdleLoop] Error resolving mission ${mission.id}:`, error);
					}
				}
			}
		}

		// Process mission automation (before resolving missions)
		// Per plan Phase 4.6: MissionAutomationSystem returns actions that IdleLoop processes
		const automationResult = automateMissionSelection(
			new GameState(previousState.playerId, previousState.lastPlayed, entities, resources)
		);

		// Execute automation actions (start new missions)
		for (const action of automationResult.actions) {
			try {
				const context: RequirementContext = {
					entities,
					resources,
					currentTime: now
				};

				const result = action.execute(context, {
					missionId: action['missionId'],
					adventurerId: action['adventurerId'],
					startedAt: now
				});
				if (result.success) {
					const effectResult = applyEffects(result.effects, entities, resources);
					resources = effectResult.resources;

					const actionEvents = action.generateEvents(
						entities,
						resources,
						result.effects,
						{
							missionId: action['missionId'],
							adventurerId: action['adventurerId'],
							startedAt: now
						}
					);
					events.push(...actionEvents);
				}
			} catch (error) {
				console.error(`[IdleLoop] Error processing automation action:`, error);
			}
		}

		// Process crafting queue (after missions)
		// Per plan Phase 3.5: CraftingSystem returns actions that IdleLoop processes
		const craftingResult = processCraftingQueue(
			new GameState(previousState.playerId, previousState.lastPlayed, entities, resources),
			now
		);

		// Execute crafting actions
		for (const action of craftingResult.actions) {
			try {
				const context: RequirementContext = {
					entities,
					resources,
					currentTime: now
				};

				const result = action.execute(context, {});
				if (result.success) {
					const effectResult = applyEffects(result.effects, entities, resources);
					resources = effectResult.resources;

					const actionEvents = action.generateEvents(
						entities,
						resources,
						result.effects,
						{}
					);
					events.push(...actionEvents);
				}
			} catch (error) {
				console.error(`[IdleLoop] Error processing crafting action:`, error);
			}
		}

		events.push(...craftingResult.events);

		// Create new GameState with updated entities and resources
		const newState = new GameState(
			previousState.playerId,
			previousState.lastPlayed,
			entities,
			resources
		);

		return {
			newState,
			events
		};
	}
}

