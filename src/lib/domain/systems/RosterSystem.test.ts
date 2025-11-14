import { describe, it, expect } from 'vitest';
import { RosterSystem } from './RosterSystem';
import { AgentInstance } from '../entities/AgentInstance';
import { Identifier } from '../valueObjects/Identifier';
import { NumericStatMap } from '../valueObjects/NumericStatMap';
import { Duration } from '../valueObjects/Duration';
import { Timestamp } from '../valueObjects/Timestamp';
import type {
	AgentId,
	OrganizationId,
	AgentTemplateId
} from '../valueObjects/Identifier';

describe('RosterSystem', () => {
	const createAgent = (
		status: 'IDLE' | 'ASSIGNED' | 'INJURED' | 'UNAVAILABLE' = 'IDLE',
		experience: number = 0
	): AgentInstance => {
		const id: AgentId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const templateId: AgentTemplateId = Identifier.generate();
		const effectiveStats = NumericStatMap.fromMap(new Map([['strength', 10]]));
		return new AgentInstance(
			id,
			orgId,
			templateId,
			1,
			experience,
			effectiveStats,
			status
		);
	};

	const system = new RosterSystem();

	describe('updateAgents', () => {
		it('should return recovery update for injured agents', () => {
			const agent = createAgent('INJURED');
			const delta = Duration.ofMinutes(10);
			const now = Timestamp.now();
			const updates = system.updateAgents([agent], delta, now);

			expect(updates.length).toBe(1);
			expect(updates[0].agentId).toBe(agent.id);
			expect(updates[0].statusChange).toBe('IDLE');
		});

		it('should return level-up update when XP threshold reached', () => {
			const agent = createAgent('IDLE', 100); // Level 1 requires 100 XP
			const delta = Duration.ofMinutes(1);
			const now = Timestamp.now();
			const updates = system.updateAgents([agent], delta, now);

			expect(updates.length).toBe(1);
			expect(updates[0].agentId).toBe(agent.id);
			expect(updates[0].levelUp).toBe(true);
		});

		it('should return empty array for healthy idle agents', () => {
			const agent = createAgent('IDLE', 50);
			const delta = Duration.ofMinutes(1);
			const now = Timestamp.now();
			const updates = system.updateAgents([agent], delta, now);

			expect(updates.length).toBe(0);
		});

		it('should handle multiple agents', () => {
			const agent1 = createAgent('INJURED');
			const agent2 = createAgent('IDLE', 100);
			const delta = Duration.ofMinutes(10);
			const now = Timestamp.now();
			const updates = system.updateAgents([agent1, agent2], delta, now);

			expect(updates.length).toBe(2);
		});
	});
});

