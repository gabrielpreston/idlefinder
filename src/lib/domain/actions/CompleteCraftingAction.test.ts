/**
 * CompleteCraftingAction Tests
 */

import { describe, it, expect } from 'vitest';
import { CompleteCraftingAction } from './CompleteCraftingAction';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import type { RequirementContext, Entity } from '../primitives/Requirement';
import { Timestamp } from '../valueObjects/Timestamp';
import type { Effect } from '../primitives/Effect';
import { CraftingJob } from '../entities/CraftingJob';
import { Identifier } from '../valueObjects/Identifier';
import type { CraftingJobAttributes } from '../attributes/CraftingJobAttributes';
import { Item } from '../entities/Item';
import { applyEffects } from '../primitives/Effect';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { GameConfig } from '../config/GameConfig';

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

describe('CompleteCraftingAction', () => {
	describe('getRequirements', () => {
		it('should return entityExistsRequirement for job', () => {
			const action = new CompleteCraftingAction('job-1');
			const requirements = action.getRequirements();

			expect(requirements.length).toBe(1);
		});
	});

	describe('requirement evaluation', () => {
		it('should fail when job not found', () => {
			const entities = new Map();
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new CompleteCraftingAction('nonexistent-job');
			const result = action.execute(context, {});

			expect(result.success).toBe(false);
			expect(result.error).toContain('does not exist');
		});

		it('should pass when job exists', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new CompleteCraftingAction('job-1');
			const result = action.execute(context, {});

			expect(result.success).toBe(true);
			expect(result.effects.length).toBe(2);
		});
	});

	describe('computeEffects', () => {
		it('should throw error when job not found', () => {
			const entities = new Map();
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new CompleteCraftingAction('nonexistent-job');

			expect(() => {
				action.computeEffects(context, {});
			}).toThrow('CraftingJob nonexistent-job not found');
		});

		it('should throw error when recipe not found', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'nonexistent-recipe' });
			const entities = new Map([[job.id, job]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new CompleteCraftingAction('job-1');

			expect(() => {
				action.computeEffects(context, {});
			}).toThrow('Recipe nonexistent-recipe not found');
		});

		it('should create item with correct stats from recipe', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new CompleteCraftingAction('job-1');
			const effects = action.computeEffects(context, {});

			// Apply effects and verify item is created correctly (behavioral test)
			const testEntities = new Map(entities);
			const testResources = new ResourceBundle(new Map());
			const result = effects[0].apply(testEntities, testResources);
			
			// Find the created item
			const createdItems = Array.from(result.entities.values()).filter(
				(e) => e.type === 'Item'
			) as Item[];
			expect(createdItems.length).toBe(1);
			
			const item = createdItems[0];
			expect(item.attributes.itemType).toBe('weapon');
			expect(item.attributes.rarity).toBe('common');
			expect(item.attributes.baseValue).toBe(50);
			// Verify stats from recipe (attackBonus: 1, damageBonus: 1)
			expect(item.attributes.stats.get('attackBonus')).toBe(1);
			expect(item.attributes.stats.get('damageBonus')).toBe(1);
		});

		it('should create SetEntityAttributeEffect for job completion', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'common-weapon' });
			const entities = new Map([[job.id, job]]);
			const context: RequirementContext = {
				entities,
				resources: new ResourceBundle(new Map()),
				currentTime: Timestamp.now()
			};

			const action = new CompleteCraftingAction('job-1');
			const effects = action.computeEffects(context, {});

			// Apply effects and verify job status changed (behavioral test)
			const result = applyEffects(effects, entities, new ResourceBundle(new Map()));
			const updatedJob = result.entities.get('job-1');
			expect(updatedJob).toBeDefined();
			expect((updatedJob as CraftingJob).attributes.status).toBe('completed');
		});
	});

	describe('generateEvents', () => {
		it('should return empty array when job not found', () => {
			const entities = new Map<string, Entity>();
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new CompleteCraftingAction('nonexistent-job');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events).toEqual([]);
		});

		it('should return CraftingCompleted event', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'common-weapon' });
			const entities = new Map<string, Entity>([[job.id, job]]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new CompleteCraftingAction('job-1');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events.length).toBeGreaterThanOrEqual(1);
			expect(events[0]?.type).toBe('CraftingCompleted');
			if (events[0]?.type === 'CraftingCompleted') {
				expect((events[0].payload as { jobId: string }).jobId).toBe('job-1');
				expect((events[0].payload as { recipeId: string }).recipeId).toBe('common-weapon');
			}
		});

		it('should return ItemCreated event when item exists', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'common-weapon' });
			const item = new Item(
				Identifier.generate<'ItemId'>(),
				{
					itemType: 'weapon',
					rarity: 'common',
					stats: NumericStatMap.fromMap(new Map([['attackBonus', 1]])),
					durability: GameConfig.items.maxDurability,
					maxDurability: GameConfig.items.maxDurability,
					baseValue: 50
				},
				['common', 'weapon'],
				'InArmory',
				{},
				{}
			);
			// Add job first, then item (item should be last in entities.values())
			const entities = new Map<string, Entity>([
				[job.id, job],
				[item.id, item]
			]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new CompleteCraftingAction('job-1');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			expect(events.length).toBe(2);
			expect(events[0]?.type).toBe('CraftingCompleted');
			expect(events[1]?.type).toBe('ItemCreated');
			if (events[1]?.type === 'ItemCreated') {
				expect((events[1].payload as { itemId: string }).itemId).toBe(item.id);
				expect((events[1].payload as { itemType: string }).itemType).toBe('weapon');
				expect((events[1].payload as { rarity: string }).rarity).toBe('common');
			}
		});

		it('should not return ItemCreated event when item not found', () => {
			const job = createTestCraftingJob({ id: 'job-1', recipeId: 'common-weapon' });
			const entities = new Map<string, Entity>([[job.id, job]]);
			const resources = new ResourceBundle(new Map());
			const effects: Effect[] = [];

			const action = new CompleteCraftingAction('job-1');
			const events = action.generateEvents(entities, resources, effects, {}, Timestamp.now());

			// Should only have CraftingCompleted event, no ItemCreated
			expect(events.length).toBe(1);
			expect(events[0]?.type).toBe('CraftingCompleted');
			if (events[0]?.type === 'CraftingCompleted') {
				// itemId should be empty string when item not found
				expect((events[0].payload as { itemId: string }).itemId).toBe('');
			}
		});
	});
});

