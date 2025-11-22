/**
 * Mission Builder - Fluent API for creating test missions
 */

import type { Mission } from '../../domain/entities/Mission';
import { createTestMission } from '../testFactories';
import { Duration } from '../../domain/valueObjects/Duration';
import { Timestamp } from '../../domain/valueObjects/Timestamp';

export class MissionBuilder {
	private overrides: Parameters<typeof createTestMission>[0] = {};

	/**
	 * Set mission ID
	 */
	id(id: string): this {
		this.overrides = { ...this.overrides, id };
		return this;
	}

	/**
	 * Set mission name
	 */
	name(name: string): this {
		this.overrides = { ...this.overrides, name };
		return this;
	}

	/**
	 * Set mission state to Available
	 */
	available(): this {
		this.overrides = { ...this.overrides, state: 'Available' };
		return this;
	}

	/**
	 * Set mission state to InProgress
	 */
	inProgress(): this {
		this.overrides = { ...this.overrides, state: 'InProgress' };
		return this;
	}

	/**
	 * Set mission state to Completed
	 */
	completed(): this {
		this.overrides = { ...this.overrides, state: 'Completed' };
		return this;
	}

	/**
	 * Set mission state to Expired
	 */
	expired(): this {
		this.overrides = { ...this.overrides, state: 'Expired' };
		return this;
	}

	/**
	 * Set difficulty tier
	 */
	withDifficulty(difficultyTier: 'Easy' | 'Medium' | 'Hard' | 'Legendary'): this {
		this.overrides = { ...this.overrides, difficultyTier };
		return this;
	}

	/**
	 * Set rewards (gold and XP)
	 */
	withRewards(_gold: number, _xp: number): this {
		// Note: createTestMission uses baseRewards internally
		// This would require extending createTestMission to accept rewards
		// For now, we'll use difficulty tier to affect rewards
		return this;
	}

	/**
	 * Set base duration
	 */
	withDuration(duration: Duration): this {
		this.overrides = { ...this.overrides, baseDuration: duration };
		return this;
	}

	/**
	 * Set started timestamp
	 */
	startedAt(timestamp: Timestamp): this {
		this.overrides = { ...this.overrides, startedAt: timestamp };
		return this;
	}

	/**
	 * Set ends timestamp
	 */
	endsAt(timestamp: Timestamp): this {
		this.overrides = { ...this.overrides, endsAt: timestamp };
		return this;
	}

	/**
	 * Build the mission
	 */
	build(): Mission {
		return createTestMission(this.overrides);
	}
}

/**
 * Create a new mission builder
 */
export function missionBuilder(): MissionBuilder {
	return new MissionBuilder();
}

