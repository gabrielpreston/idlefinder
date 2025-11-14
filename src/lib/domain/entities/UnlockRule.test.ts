import { describe, it, expect } from 'vitest';
import { UnlockRule } from './UnlockRule';
import { Identifier } from '../valueObjects/Identifier';
import type {
	TaskArchetypeId,
	FacilityTemplateId,
	AgentTemplateId
} from '../valueObjects/Identifier';

describe('UnlockRule', () => {
	it('should create valid unlock rule', () => {
		const taskId: TaskArchetypeId = Identifier.generate();
		const rule = new UnlockRule('rule-1', 'exploration', 100, {
			newTaskArchetypes: [taskId]
		});
		expect(rule.trackKey).toBe('exploration');
		expect(rule.thresholdValue).toBe(100);
		expect(rule.effects.newTaskArchetypes).toEqual([taskId]);
	});

	it('should throw error for negative threshold', () => {
		expect(() => new UnlockRule('rule-1', 'track', -1, {})).toThrow(
			'UnlockRule thresholdValue cannot be negative'
		);
	});

	it('should support multiple effect types', () => {
		const taskId: TaskArchetypeId = Identifier.generate();
		const facilityId: FacilityTemplateId = Identifier.generate();
		const agentId: AgentTemplateId = Identifier.generate();
		const rule = new UnlockRule('rule-1', 'progress', 50, {
			newTaskArchetypes: [taskId],
			newFacilityTemplates: [facilityId],
			newAgentTemplates: [agentId]
		});
		expect(rule.effects.newTaskArchetypes).toEqual([taskId]);
		expect(rule.effects.newFacilityTemplates).toEqual([facilityId]);
		expect(rule.effects.newAgentTemplates).toEqual([agentId]);
	});
});

