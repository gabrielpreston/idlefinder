/**
 * Action Test Helpers - Reusable utilities for testing Actions
 * Provides behavioral testing patterns that verify observable outcomes
 * through public APIs instead of accessing private fields
 */

import { expect } from 'vitest';
import { applyEffects, type Effect } from '../domain/primitives/Effect';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import type { Entity } from '../domain/primitives/Requirement';
import type { EffectResult } from '../domain/primitives/Effect';

/**
 * Apply effects and return the resulting state
 * Use this to verify behavior instead of accessing private fields
 */
export function applyEffectsAndGetResult(
	effects: Effect[],
	entities: Map<string, Entity>,
	resources: ResourceBundle
): EffectResult {
	return applyEffects(effects, entities, resources);
}

/**
 * Resource expectation configuration
 */
export interface ResourceExpectation {
	min?: number;
	max?: number;
	exact?: number;
}

/**
 * Verify that effects modify resources as expected
 */
export function expectResourceChange(
	effects: Effect[],
	initialResources: ResourceBundle,
	entities: Map<string, Entity>,
	expectations: Record<string, number | ResourceExpectation>
): EffectResult {
	const result = applyEffects(effects, entities, initialResources);

	for (const [resourceType, expected] of Object.entries(expectations)) {
		const actual = result.resources.get(resourceType);

		if (typeof expected === 'number') {
			expect(actual).toBe(expected);
		} else if (expected.exact !== undefined) {
			expect(actual).toBe(expected.exact);
		} else {
			if (expected.min !== undefined) {
				expect(actual).toBeGreaterThanOrEqual(expected.min);
			}
			if (expected.max !== undefined) {
				expect(actual).toBeLessThanOrEqual(expected.max);
			}
		}
	}

	return result;
}

/**
 * Verify that effects change entity state as expected
 */
export function expectEntityStateChange(
	effects: Effect[],
	entities: Map<string, Entity>,
	entityId: string,
	expectations: {
		state?: string;
		attributePath?: string;
		attributeValue?: unknown;
	}
): EffectResult {
	const result = applyEffects(effects, entities, new ResourceBundle(new Map()));
	const entity = result.entities.get(entityId);

	expect(entity).toBeDefined();

	if (expectations.state) {
		expect((entity as Entity & { state: string }).state).toBe(expectations.state);
	}

	if (expectations.attributePath && expectations.attributeValue !== undefined) {
		const parts = expectations.attributePath.split('.');
		let value: unknown = entity;
		for (const part of parts) {
			value = (value as Record<string, unknown>)[part];
		}
		expect(value).toBe(expectations.attributeValue);
	}

	return result;
}

/**
 * Verify that effects create expected entities
 */
export function expectEntityCreated(
	effects: Effect[],
	entities: Map<string, Entity>,
	entityType: string,
	expectations?: {
		count?: number;
		predicate?: (entity: Entity) => boolean;
	}
): { result: EffectResult; created: Entity[] } {
	const result = applyEffects(effects, entities, new ResourceBundle(new Map()));
	const created = Array.from(result.entities.values()).filter(
		(e) => e.type === entityType
	);

	if (expectations?.count !== undefined) {
		expect(created.length).toBe(expectations.count);
	}

	if (expectations?.predicate) {
		expect(created.some(expectations.predicate)).toBe(true);
	}

	return { result, created };
}

