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
import type { DomainEvent } from '../../bus/types';
import type { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import type { Mission } from '../entities/Mission';
import type { Adventurer } from '../entities/Adventurer';
import type { Entity } from '../primitives/Requirement';
import type { ResourceBundle } from '../valueObjects/ResourceBundle';

export interface StartMissionParams {
	missionId: string;
	adventurerId: string;
	startedAt: Timestamp;
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
		const startedAt = startParams?.startedAt || context.currentTime;

		// Get mission to compute endsAt
		const mission = context.entities.get(this.missionId) as Mission;
		if (!mission) {
			throw new Error(`Mission ${this.missionId} not found`);
		}

		// Calculate endsAt: now + baseDuration
		const endsAt = startedAt.add(mission.attributes.baseDuration);

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
		const mission = entities.get(this.missionId) as Mission;
		const adventurer = entities.get(this.adventurerId) as Adventurer;

		if (!mission || !adventurer) {
			return [];
		}

		const startedAt = startParams.startedAt;
		const endsAt = mission.timers.get('endsAt');
		const duration = endsAt && startedAt
			? Duration.between(startedAt, endsAt).toMilliseconds()
			: mission.attributes.baseDuration.toMilliseconds();

		return [
			{
				type: 'MissionStarted',
				payload: {
					missionId: this.missionId,
					adventurerIds: [this.adventurerId],
					startTime: startedAt ? startedAt.value.toString() : new Date().toISOString(),
					duration
				},
				timestamp: new Date().toISOString()
			}
		];
	}
}

