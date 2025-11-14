import { describe, it, expect } from 'vitest';
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
			const results = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);

			expect(results.length).toBe(1);
			expect(results[0].taskId).toBe(task.id);
			expect(results[0].outcomeCategory).toBeDefined();
		});

		it('should not resolve tasks not ready', () => {
			const task = createTask();
			const archetype = createArchetype(task.taskArchetypeId);
			const agent = createAgent();
			task.assignedAgentIds.push(agent.id);

			const now = task.expectedCompletionAt.subtract(Duration.ofSeconds(1));
			const results = system.resolveTasks(
				[task],
				new Map([[agent.id.value, agent]]),
				new Map([[archetype.id.value, archetype]]),
				[],
				now
			);

			expect(results.length).toBe(0);
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

			expect(result1.length).toBe(result2.length);
			if (result1.length > 0 && result2.length > 0) {
				expect(result1[0].outcomeCategory).toBe(result2[0].outcomeCategory);
				expect(result1[0].rewards.get('gold')).toBe(result2[0].rewards.get('gold'));
			}
		});
	});
});

