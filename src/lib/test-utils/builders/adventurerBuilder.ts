/**
 * Adventurer Builder - Fluent API for creating test adventurers
 */

import type { Adventurer } from '../../domain/entities/Adventurer';
import { createTestAdventurer } from '../testFactories';

export class AdventurerBuilder {
	private overrides: Parameters<typeof createTestAdventurer>[0] = {};

	/**
	 * Set adventurer ID
	 */
	id(id: string): AdventurerBuilder {
		this.overrides = { ...this.overrides, id };
		return this;
	}

	/**
	 * Set adventurer name
	 */
	name(name: string): AdventurerBuilder {
		this.overrides = { ...this.overrides, name };
		return this;
	}

	/**
	 * Set level
	 */
	level(level: number): AdventurerBuilder {
		this.overrides = { ...this.overrides, level };
		return this;
	}

	/**
	 * Set XP
	 */
	xp(xp: number): AdventurerBuilder {
		this.overrides = { ...this.overrides, xp };
		return this;
	}

	/**
	 * Set state to Idle
	 */
	idle(): AdventurerBuilder {
		this.overrides = { ...this.overrides, state: 'Idle' };
		return this;
	}

	/**
	 * Set state to OnMission
	 */
	onMission(): AdventurerBuilder {
		this.overrides = { ...this.overrides, state: 'OnMission' };
		return this;
	}

	/**
	 * Set state to Fatigued
	 */
	fatigued(): AdventurerBuilder {
		this.overrides = { ...this.overrides, state: 'Fatigued' };
		return this;
	}

	/**
	 * Set state to Recovering
	 */
	recovering(): AdventurerBuilder {
		this.overrides = { ...this.overrides, state: 'Recovering' };
		return this;
	}

	/**
	 * Set state to Dead
	 */
	dead(): AdventurerBuilder {
		this.overrides = { ...this.overrides, state: 'Dead' };
		return this;
	}

	/**
	 * Set tags
	 */
	withTags(tags: string[]): AdventurerBuilder {
		this.overrides = { ...this.overrides, tags };
		return this;
	}

	/**
	 * Build the adventurer
	 */
	build(): Adventurer {
		return createTestAdventurer(this.overrides);
	}
}

/**
 * Create a new adventurer builder
 */
export function adventurerBuilder(): AdventurerBuilder {
	return new AdventurerBuilder();
}

