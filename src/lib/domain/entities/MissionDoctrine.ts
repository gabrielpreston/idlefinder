/**
 * Mission Doctrine Entity - Configuration entity for mission automation
 * Per Systems Primitives Spec and plan correction: Must be entity in GameState.entities Map
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { MissionDoctrineAttributes } from '../attributes/MissionDoctrineAttributes';
import type { MissionDoctrineState } from '../states/MissionDoctrineState';
import type { Entity } from '../primitives/Requirement';
import { validateEntity } from '../primitives/EntityValidation';
import type { EntityMetadata } from '../primitives/EntityMetadata';

export type MissionDoctrineId = Identifier<'MissionDoctrineId'>;

/**
 * Mission Doctrine Entity - Per plan Phase 4.1
 * Must be stored in GameState.entities Map (not metadata)
 */
export class MissionDoctrine implements Entity {
	private readonly _id: MissionDoctrineId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'MissionDoctrine' as const;
	readonly attributes: MissionDoctrineAttributes;
	readonly tags: ReadonlyArray<string>;
	state: MissionDoctrineState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: MissionDoctrineId,
		attributes: MissionDoctrineAttributes,
		tags: string[] = [],
		state: MissionDoctrineState = 'Active',
		timers: Record<string, number | null> = {},
		metadata: EntityMetadata = {}
	) {
		// Validate entity
		validateEntity(id.value, 'MissionDoctrine');

		this._id = id;
		this.id = id.value; // String ID for Entity interface
		this.attributes = attributes;
		this.tags = [...tags]; // Create copy for immutability
		this.state = state;
		this.timers = { ...timers }; // Create copy
		// Ensure metadata.loreTags is copied for immutability if present
		this.metadata = metadata.loreTags
			? { ...metadata, loreTags: [...metadata.loreTags] }
			: { ...metadata }; // Create copy
	}

	/**
	 * Update focus
	 */
	updateFocus(focus: MissionDoctrineAttributes['focus']): void {
		this.attributes.focus = focus;
	}

	/**
	 * Update risk tolerance
	 */
	updateRiskTolerance(riskTolerance: MissionDoctrineAttributes['riskTolerance']): void {
		this.attributes.riskTolerance = riskTolerance;
	}

	/**
	 * Get default mission doctrine
	 */
	static createDefault(id: MissionDoctrineId): MissionDoctrine {
		return new MissionDoctrine(
			id,
			{
				focus: 'balanced',
				riskTolerance: 'medium'
			},
			['mission-doctrine'],
			'Active',
			{},
			{ displayName: 'Mission Doctrine' }
		);
	}
}

