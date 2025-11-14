import { describe, it, expect } from 'vitest';
import { AgentInstance } from './AgentInstance';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { NumericStatMap } from '$lib/domain/valueObjects/NumericStatMap';
import { AgentTemplate } from './AgentTemplate';
import type {
	AgentId,
	OrganizationId,
	AgentTemplateId,
	TaskInstanceId
} from '$lib/domain/valueObjects/Identifier';

describe('AgentInstance', () => {
	const createAgent = (level: number = 1, experience: number = 0): AgentInstance => {
		const id: AgentId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const templateId: AgentTemplateId = Identifier.generate();
		const effectiveStats = NumericStatMap.fromMap(new Map([['strength', 10]]));
		return new AgentInstance(
			id,
			orgId,
			templateId,
			level,
			experience,
			effectiveStats,
			'IDLE'
		);
	};

	describe('constructor', () => {
		it('should create valid agent instance', () => {
			const agent = createAgent();
			expect(agent.level).toBe(1);
			expect(agent.experience).toBe(0);
			expect(agent.status).toBe('IDLE');
		});

		it('should throw error for level less than 1', () => {
			expect(() => createAgent(0)).toThrow('Agent level must be at least 1');
		});

		it('should throw error for negative experience', () => {
			expect(() => createAgent(1, -1)).toThrow('Agent experience cannot be negative');
		});
	});

	describe('assignToTask', () => {
		it('should assign agent to task', () => {
			const agent = createAgent();
			const taskId: TaskInstanceId = Identifier.generate();
			agent.assignToTask(taskId);
			expect(agent.status).toBe('ASSIGNED');
			expect(agent.currentTaskId).toBe(taskId);
		});

		it('should throw error if agent is not IDLE', () => {
			const agent = createAgent();
			agent.status = 'ASSIGNED';
			const taskId: TaskInstanceId = Identifier.generate();
			expect(() => agent.assignToTask(taskId)).toThrow('Cannot assign agent to task');
		});
	});

	describe('completeTask', () => {
		it('should complete task and return to IDLE', () => {
			const agent = createAgent();
			const taskId: TaskInstanceId = Identifier.generate();
			agent.assignToTask(taskId);
			agent.completeTask();
			expect(agent.status).toBe('IDLE');
			expect(agent.currentTaskId).toBeUndefined();
		});

		it('should throw error if agent is not ASSIGNED', () => {
			const agent = createAgent();
			expect(() => agent.completeTask()).toThrow('Cannot complete task');
		});
	});

	describe('applyXP', () => {
		it('should add experience', () => {
			const agent = createAgent(1, 0);
			agent.applyXP(50);
			expect(agent.experience).toBe(50);
		});

		it('should level up when XP threshold is reached', () => {
			const agent = createAgent(1, 0);
			const templateId: AgentTemplateId = Identifier.generate();
			const baseStats = NumericStatMap.fromMap(new Map([['strength', 10]]));
			const level2Bonuses = NumericStatMap.fromMap(new Map([['strength', 5]]));
			const growthProfile = new Map([[2, level2Bonuses]]);
			const template = new AgentTemplate(templateId, baseStats, growthProfile, []);
			agent.setTemplate(template);

			agent.applyXP(100); // Level 1 requires 100 XP
			expect(agent.level).toBe(2);
			expect(agent.effectiveStats.get('strength')).toBe(15); // 10 + 5
		});

		it('should throw error for negative XP', () => {
			const agent = createAgent();
			expect(() => agent.applyXP(-10)).toThrow('Cannot apply negative XP');
		});
	});

	describe('levelUp', () => {
		it('should increment level and recalculate stats', () => {
			const agent = createAgent(1, 0);
			const templateId: AgentTemplateId = Identifier.generate();
			const baseStats = NumericStatMap.fromMap(new Map([['strength', 10]]));
			const level2Bonuses = NumericStatMap.fromMap(new Map([['strength', 5]]));
			const growthProfile = new Map([[2, level2Bonuses]]);
			const template = new AgentTemplate(templateId, baseStats, growthProfile, []);
			agent.setTemplate(template);

			agent.levelUp();
			expect(agent.level).toBe(2);
			expect(agent.effectiveStats.get('strength')).toBe(15);
		});
	});

	describe('markInjured', () => {
		it('should mark agent as injured', () => {
			const agent = createAgent();
			const taskId: TaskInstanceId = Identifier.generate();
			agent.assignToTask(taskId);
			agent.markInjured();
			expect(agent.status).toBe('INJURED');
			expect(agent.currentTaskId).toBeUndefined();
		});
	});

	describe('recover', () => {
		it('should recover agent from injury', () => {
			const agent = createAgent();
			agent.markInjured();
			agent.recover();
			expect(agent.status).toBe('IDLE');
		});

		it('should not change status if not injured', () => {
			const agent = createAgent();
			agent.status = 'ASSIGNED';
			agent.recover();
			expect(agent.status).toBe('ASSIGNED');
		});
	});
});

