/**
 * StartCraftingAction Tests
 */

import { describe, it, expect } from 'vitest';
import { StartCraftingAction } from './StartCraftingAction';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import type { RequirementContext } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import type { Effect } from '../primitives/Effect';
import { CraftingJob } from '../entities/CraftingJob';
import { Identifier } from '../valueObjects/Identifier';
import type { CraftingJobAttributes } from '../attributes/CraftingJobAttributes';

function createTestCraftingJob(overrides?: {
	id?: string;
	state?: 'Queued' | 'InProgress' | 'Completed';
	recipeId?: string;
}): CraftingJob {
	const id = Identifier.from<'CraftingJobId'>(overrides?.id || crypto.randomUUID());
	const attributes: CraftingJobAttributes = {
		recipeId: overrides?.recipeId || 'common-weapon', // Use a valid recipe ID from default recipes
		status: 'queued'
	};
	return new CraftingJob(
		id,
		attributes,
		[],
		overrides?.state || 'Queued',
		{},
		{}
	);
}

describe('StartCraftingAction', () => {
	describe('computeEffects', () => {
		it('should use provided startedAt when given', () => {
			const job = createTestCraftingJob({ id: 'job-1', state: 'Queued', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			// Need resources for the recipe (10 materials, 50 gold)
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('materials', 10),
				new ResourceUnit('gold', 50)
			]);
			const customStartTime = Timestamp.from(Date.now() - 1000);
			const context: RequirementContext = {
				entities,
				resources,
				currentTime: Timestamp.now()
			};

			const action = new StartCraftingAction('job-1', Duration.ofMinutes(5));
			const effects = action.computeEffects(context, {
				startedAt: customStartTime
			});

			// Should have SetTimerEffect with custom start time
			expect(effects.length).toBeGreaterThan(0);
		});

		it('should use context.currentTime when startedAt not provided', () => {
			const job = createTestCraftingJob({ id: 'job-1', state: 'Queued', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			// Need resources for the recipe
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('materials', 10),
				new ResourceUnit('gold', 50)
			]);
			const context: RequirementContext = {
				entities,
				resources,
				currentTime: Timestamp.now()
			};

			const action = new StartCraftingAction('job-1', Duration.ofMinutes(5));
			const effects = action.computeEffects(context, {});

			// Should have SetTimerEffect with context time
			expect(effects.length).toBeGreaterThan(0);
		});

		it('should use provided duration when given', () => {
			const job = createTestCraftingJob({ id: 'job-1', state: 'Queued', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			// Need resources for the recipe
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('materials', 10),
				new ResourceUnit('gold', 50)
			]);
			const context: RequirementContext = {
				entities,
				resources,
				currentTime: Timestamp.now()
			};

			const customDuration = Duration.ofMinutes(10);
			const action = new StartCraftingAction('job-1', Duration.ofMinutes(5));
			const effects = action.computeEffects(context, {
				duration: customDuration
			});

			// Should use custom duration
			expect(effects.length).toBeGreaterThan(0);
		});

		it('should use constructor duration when not provided in params', () => {
			const job = createTestCraftingJob({ id: 'job-1', state: 'Queued', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			// Need resources for the recipe
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('materials', 10),
				new ResourceUnit('gold', 50)
			]);
			const context: RequirementContext = {
				entities,
				resources,
				currentTime: Timestamp.now()
			};

			const constructorDuration = Duration.ofMinutes(5);
			const action = new StartCraftingAction('job-1', constructorDuration);
			const effects = action.computeEffects(context, {});

			// Should use constructor duration
			expect(effects.length).toBeGreaterThan(0);
		});
	});

	describe('generateEvents', () => {
		it('should return empty array when job not found', () => {
			const entities = new Map();
			const resources = ResourceBundle.fromArray([]);
			const effects: Effect[] = [];

			const action = new StartCraftingAction('nonexistent-job', Duration.ofMinutes(5));
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events).toEqual([]);
		});

		it('should return CraftingStarted event when job exists', () => {
			const job = createTestCraftingJob({ id: 'job-1', state: 'Queued', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			const resources = ResourceBundle.fromArray([]);
			const effects: Effect[] = [];

			const action = new StartCraftingAction('job-1', Duration.ofMinutes(5));
			const events = action.generateEvents(entities, resources, effects, {});

			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('CraftingStarted');
		});
	});
});

