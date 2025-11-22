/**
 * StartMission Action - Per Systems Primitives Spec section 10.2
 * Requirements: mission.state == Available, adventurer.state == Idle
 * Effects: mission.state = InProgress, mission.startedAt = now, mission.endsAt = now + baseDuration, adventurer.state = OnMission
 * Events: MissionStarted
 */

import { Action } from '../primitives/Action';
import type { Requirement, RequirementContext } from '../primitives/Requirement';
import {
	entityExistsRequirement,
	entityStateRequirement,
	allRequirements
} from '../primitives/Requirement';
import {
	SetEntityStateEffect,
	SetTimerEffect,
	type Effect
} from '../primitives/Effect';
import type { DomainEvent } from '../primitives/Event';
import type { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';
import { getTimer } from '../primitives/TimerHelpers';
import { calculateEffectiveDuration } from '../systems/MissionDurationModifiers';
import { GameState } from '../entities/GameState';

export interface StartMissionParams {
	missionId: string;
	adventurerId: string;
	startedAt?: Timestamp;
}

/**
 * StartMission Action - Per spec lines 399, 404-409
 */
export class StartMissionAction extends Action {
	constructor(
		private readonly missionId: string,
		private readonly adventurerId: string
	) {
		super();
	}

	getRequirements(): Requirement[] {
		return [
			allRequirements(
				entityExistsRequirement(this.missionId, 'Mission'),
				entityStateRequirement(this.missionId, 'Available')
			),
			allRequirements(
				entityExistsRequirement(this.adventurerId, 'Adventurer'),
				entityStateRequirement(this.adventurerId, 'Idle')
			)
		];
	}

	computeEffects(
		context: RequirementContext,
		params: Record<string, unknown>
	): Effect[] {
		const startParams = params as unknown as StartMissionParams;
		const startedAt = startParams.startedAt ?? context.currentTime;

		// Get mission to compute endsAt
		// Mission existence is guaranteed by requirements check
		const mission = context.entities.get(this.missionId) as Mission;

		// Get adventurer for modifier calculation
		const adventurer = context.entities.get(this.adventurerId) as Adventurer | undefined;

		// Create GameState for modifier calculation
		const gameState = new GameState(
			'', // playerId not needed for modifier calculation
			context.currentTime,
			context.entities,
			context.resources
		);

		// Calculate effective duration with modifiers
		const effectiveDuration = calculateEffectiveDuration(mission, adventurer, gameState);

		// Calculate endsAt: now + effectiveDuration
		const endsAt = startedAt.add(effectiveDuration);

		// Return effects - Effects will call entity methods
		return [
			// Mission timers: startedAt and endsAt (must be set before state transition)
			new SetTimerEffect(this.missionId, 'startedAt', startedAt),
			new SetTimerEffect(this.missionId, 'endsAt', endsAt),
			// Mission state: Available -> InProgress (via mission.start())
			new SetEntityStateEffect(this.missionId, 'InProgress'),
			// Adventurer state: Idle -> OnMission (via adventurer.assignToMission())
			// Pass missionId so Effect can call assignToMission()
			new SetEntityStateEffect(this.adventurerId, 'OnMission', this.missionId)
		];
	}

	generateEvents(
		entities: Map<string, Entity>,
		resources: ResourceBundle,
		effects: Effect[],
		params: Record<string, unknown>
	): DomainEvent[] {
		const startParams = params as unknown as StartMissionParams;
		const mission = entities.get(this.missionId) as Mission | undefined;
		const adventurer = entities.get(this.adventurerId) as Adventurer | undefined;

		if (!mission || !adventurer) {
			return [];
		}

		// Get startedAt from params or from mission timer
		const startedAt = startParams.startedAt ?? getTimer(mission, 'startedAt');
		const endsAt = getTimer(mission, 'endsAt');
		
		// Calculate duration
		const duration = (startedAt && endsAt)
			? Duration.between(startedAt, endsAt).toMilliseconds()
			: mission.attributes.baseDuration.toMilliseconds();

		// Use startedAt if available, otherwise use current time
		const startTime = startedAt
			? startedAt.value.toString()
			: new Date().toISOString();

		return [
			{
				type: 'MissionStarted',
				payload: {
					missionId: this.missionId,
					adventurerIds: [this.adventurerId],
					startTime,
					duration
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

