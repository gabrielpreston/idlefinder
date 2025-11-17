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
import type { DomainEvent } from '../../bus/types';

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
				const endsAt = mission.timers.get('endsAt');
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

