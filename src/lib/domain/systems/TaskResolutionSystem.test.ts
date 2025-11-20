import { describe, it, expect, vi } from 'vitest';
import { TaskResolutionSystem } from './TaskResolutionSystem';
import { TaskInstance } from '../entities/TaskInstance';
import { AgentInstance } from '../entities/AgentInstance';
import { TaskArchetype } from '../entities/TaskArchetype';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { Duration } from '../valueObjects/Duration';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { ResourceBundle, ResourceUnit } from '../valueObjects';
import type {
	TaskInstanceId,
	OrganizationId,
	TaskArchetypeId,
	AgentId,
	AgentTemplateId
} from '../valueObjects/Identifier';

describe('TaskResolutionSystem', () => {
	const createTask = (): TaskInstance => {
		const id: TaskInstanceId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const archetypeId: TaskArchetypeId = Identifier.generate();
		const startedAt = Timestamp.now();
		const expectedCompletionAt = startedAt.add(Duration.ofMinutes(5));
		return new TaskInstance(
			id,
			orgId,
			archetypeId,
			startedAt,
			expectedCompletionAt,
			'IN_PROGRESS'
		);
	};

	const createAgent = (strength: number = 10): AgentInstance => {
		const id: AgentId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const templateId: AgentTemplateId = Identifier.generate();
		const effectiveStats = NumericStatMap.fromMap(new Map([['strength', strength]]));
		return new AgentInstance(
			id,
			orgId,
			templateId,
			1,
			0,
			effectiveStats,
			'ASSIGNED'
		);
	};

	const createArchetype = (id?: TaskArchetypeId): TaskArchetype => {
		const archetypeId = id || Identifier.generate();
		const entryCost = ResourceBundle.fromArray([new ResourceUnit('gold', 10)]);
		const baseReward = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		return new TaskArchetype(
			archetypeId,
			'test-category',
			Duration.ofMinutes(5),
			1,
			3,
			'strength',
			[],
			entryCost,
			baseReward,
			new Map()
		);
	};

	const system = new TaskResolutionSystem();

	describe('resolveTasks', () => {
		it('should resolve ready tasks', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			const agent = createAgent(50);
			task.assignedAgentIds.push(agent.id);

			const now = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			const result = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);

			expect(result.success).toBe(true);
			if (!result.data) throw new Error('Expected data');
			expect(result.data.length).toBe(1);
			expect(result.data[0].taskId).toBe(task.id);
			expect(result.data[0].outcomeCategory).toBeDefined();
		});

		it('should not resolve tasks not ready', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			const agent = createAgent();
			task.assignedAgentIds.push(agent.id);

			const now = task.expectedCompletionAt.subtract(Duration.ofSeconds(1));
			const result = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);

			expect(result.success).toBe(true);
			expect(result.data?.length).toBe(0);
		});
	});

	describe('determinism', () => {
		it('should produce same results for same inputs', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			const agent = createAgent(50);
			task.assignedAgentIds.push(agent.id);

			const now = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			const agents = new Map([[agent.id.value, agent]]);
			const archetypes = new Map([[archetype.id.value, archetype]]);

			const result1 = system.resolveTasks([task], agents, archetypes, [], now);
			const result2 = system.resolveTasks([task], agents, archetypes, [], now);

			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
			if (!result1.data || !result2.data) throw new Error('Expected data');
			expect(result1.data.length).toBe(result2.data.length);
			if (result1.data.length > 0 && result2.data.length > 0) {
				expect(result1.data[0].outcomeCategory).toBe(result2.data[0].outcomeCategory);
				expect(result1.data[0].rewards.get('gold')).toBe(result2.data[0].rewards.get('gold'));
			}
		});
	});

	describe('edge cases', () => {
		it('should handle missing archetype gracefully', () => {
			const task = createTask();
			const agent = createAgent(50);
			task.assignedAgentIds.push(agent.id);

			const now = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const result = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map(), // Empty archetypes map
				[],
				now
			);

			expect(result.success).toBe(true);
			expect(result.data?.length).toBe(0);
			// Should have warning about missing archetype
			expect(result.warnings?.length).toBeGreaterThan(0);

			consoleSpy.mockRestore();
		});

		it('should handle empty agents array in generateRewards', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			// No agents assigned - create new task with empty array
			const taskWithNoAgents = new TaskInstance(
				task.id,
				task.organizationId,
				task.taskArchetypeId,
				task.startedAt,
				task.expectedCompletionAt,
				task.status,
				task.originOfferId,
				[] // Empty agents array
			);

			const now = taskWithNoAgents.expectedCompletionAt.add(Duration.ofSeconds(1));
			const result = system.resolveTasks(
				[taskWithNoAgents],
				new Map(), // Empty agents map
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);

			expect(result.success).toBe(true);
			if (!result.data) throw new Error('Expected data');
			expect(result.data.length).toBe(1);
			// Should still generate rewards with level 1 multiplier (default)
			expect(result.data[0].rewards.get('gold')).toBeGreaterThan(0);
		});

		it('should compute agent changes with injury logic for failures', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			// Create agent with low stats to guarantee failure
			const agent = createAgent(1); // Very low strength
			task.assignedAgentIds.push(agent.id);

			const now = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			const result = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);

			expect(result.success).toBe(true);
			if (!result.data) throw new Error('Expected data');
			expect(result.data.length).toBe(1);
			expect(result.data[0].outcomeCategory).toBe('FAILURE');
			expect(result.data[0].agentChanges.length).toBe(1);
			expect(result.data[0].agentChanges[0].agentId).toBe(agent.id);
			expect(result.data[0].agentChanges[0].xpGain).toBe(10); // Failure XP
			// Injury is deterministic based on agent ID hash
			expect(typeof result.data[0].agentChanges[0].injury).toBe('boolean');
		});

		it('should handle facility effects with statBonus', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			const agent = createAgent(50);
			task.assignedAgentIds.push(agent.id);

			// Create facility with statBonus effect
			 
			const facility: import('../entities/FacilityInstance').FacilityInstance = {
				id: Identifier.generate(),
				organizationId: Identifier.generate(),
				facilityTemplateId: Identifier.generate(),
				level: 1,
				getActiveEffects: () => [
					{ effectKey: 'statBonus', value: 10 }
				]
			} as any;

			const now = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			const result = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[facility],
				now
			);

			expect(result.success).toBe(true);
			if (!result.data) throw new Error('Expected data');
			expect(result.data.length).toBe(1);
			// Score should be higher due to facility bonus
			expect(result.data[0].outcomeCategory).toBeDefined();
		});

		it('should ignore facility effects without statBonus', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			const agent = createAgent(50);
			task.assignedAgentIds.push(agent.id);

			// Create facility with non-statBonus effect
			 
			const facility: import('../entities/FacilityInstance').FacilityInstance = {
				id: Identifier.generate(),
				organizationId: Identifier.generate(),
				facilityTemplateId: Identifier.generate(),
				level: 1,
				getActiveEffects: () => [
					{ effectKey: 'otherEffect', value: 10 }
				]
			} as any;

			const now = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			const result = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[facility],
				now
			);

			expect(result.success).toBe(true);
			if (!result.data) throw new Error('Expected data');
			expect(result.data.length).toBe(1);
			// Should work normally without statBonus effect
			expect(result.data[0].outcomeCategory).toBeDefined();
		});

		it('should handle different outcome categories correctly', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);

			// Test GREAT_SUCCESS (score >= 100)
			const strongAgent = createAgent(100);
			const taskWithStrongAgent = new TaskInstance(
				task.id,
				task.organizationId,
				task.taskArchetypeId,
				task.startedAt,
				task.expectedCompletionAt,
				task.status,
				task.originOfferId,
				[strongAgent.id]
			);
			const now = taskWithStrongAgent.expectedCompletionAt.add(Duration.ofSeconds(1));
			const result1 = system.resolveTasks(
				[taskWithStrongAgent],
				new Map([[strongAgent.id.value, strongAgent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);
			expect(result1.success).toBe(true);
			if (!result1.data) throw new Error('Expected data');
			expect(result1.data[0].outcomeCategory).toBe('GREAT_SUCCESS');
			expect(result1.data[0].agentChanges[0].xpGain).toBe(50);

			// Test SUCCESS (score >= 50)
			const mediumAgent = createAgent(50);
			const taskWithMediumAgent = new TaskInstance(
				task.id,
				task.organizationId,
				task.taskArchetypeId,
				task.startedAt,
				task.expectedCompletionAt,
				task.status,
				task.originOfferId,
				[mediumAgent.id]
			);
			const result2 = system.resolveTasks(
				[taskWithMediumAgent],
				new Map([[mediumAgent.id.value, mediumAgent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);
			expect(result2.success).toBe(true);
			if (!result2.data) throw new Error('Expected data');
			expect(result2.data[0].outcomeCategory).toBe('SUCCESS');
			expect(result2.data[0].agentChanges[0].xpGain).toBe(30);
		});
	});
});

