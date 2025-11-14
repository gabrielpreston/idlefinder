import type { AgentInstance, AgentStatus } from '../entities/AgentInstance';
import type { AgentId } from '../valueObjects/Identifier';
import { Duration } from '../valueObjects/Duration';
import { Timestamp } from '../valueObjects/Timestamp';

/**
 * Agent update interface for roster system.
 */
export interface AgentUpdate {
	agentId: AgentId;
	statusChange?: AgentStatus;
	xpGain?: number;
	levelUp?: boolean;
}

/**
 * Domain system for managing agent roster and recovery.
 * Processes agent recovery over time and handles level-ups.
 */
export class RosterSystem {
	private readonly RECOVERY_DURATION_MS = 5 * 60 * 1000; // 5 minutes

	/**
	 * Updates agents over a time delta.
	 * Processes recovery for injured agents and handles level-ups.
	 * Returns updates without mutating inputs (pure function approach).
	 * Note: In practice, may need to mutate agents, but return updates for tracking.
	 */
	updateAgents(
		agents: AgentInstance[],
		_delta: Duration,
		_now: Timestamp
	): AgentUpdate[] {
		const updates: AgentUpdate[] = [];

		for (const agent of agents) {
			const update: AgentUpdate = { agentId: agent.id };

			// Handle injury recovery
			if (agent.status === 'INJURED') {
				// Check if recovery time has passed
				// For MVP, assume agents recover after fixed duration
				// In full implementation, would track injury timestamp
				update.statusChange = 'IDLE';
			}

			// Handle level-ups from accumulated XP
			const previousLevel = agent.level;
			// Check if agent should level up based on current XP
			const xpRequired = agent.level * 100;
			if (agent.experience >= xpRequired && agent.level === previousLevel) {
				update.levelUp = true;
			}

			if (update.statusChange || update.levelUp) {
				updates.push(update);
			}
		}

		return updates;
	}
}

