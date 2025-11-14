import type { Organization } from '$lib/domain/entities/Organization';
import type { TaskOffer } from '$lib/domain/entities/TaskOffer';
import type { AgentInstance } from '$lib/domain/entities/AgentInstance';
import type { TaskInstance } from '$lib/domain/entities/TaskInstance';
import type { TaskArchetype } from '$lib/domain/entities/TaskArchetype';
import type {
	OrganizationSnapshot,
	TaskOfferDTO,
	AgentDTO,
	TaskInstanceDTO
} from '$lib/types';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';

/**
 * Converts an Organization entity to OrganizationSnapshot DTO.
 */
export function organizationToSnapshot(org: Organization): OrganizationSnapshot {
	const wallet: Record<string, number> = {};
	for (const unit of org.economyState.wallet.toArray()) {
		wallet[unit.resourceType] = unit.amount;
	}

	const progressTracks: Record<string, number> = {};
	for (const [key, track] of org.progressTracks.entries()) {
		progressTracks[key] = track.currentValue;
	}

	return {
		id: org.id.value,
		wallet,
		progressTracks,
		lastSimulatedAt: org.lastSimulatedAt.value
	};
}

/**
 * Converts a TaskOffer entity to TaskOfferDTO.
 */
export function taskOfferToDTO(offer: TaskOffer, archetype: TaskArchetype): TaskOfferDTO {
	const entryCost: Record<string, number> = {};
	for (const unit of archetype.entryCost.toArray()) {
		entryCost[unit.resourceType] = unit.amount;
	}

	const baseReward: Record<string, number> = {};
	for (const unit of archetype.baseReward.toArray()) {
		baseReward[unit.resourceType] = unit.amount;
	}

	return {
		id: offer.id.value,
		taskArchetypeId: offer.taskArchetypeId.value,
		category: archetype.category,
		minAgents: archetype.minAgents,
		maxAgents: archetype.maxAgents,
		entryCost,
		baseReward,
		expiresAt: offer.expiresAt?.value
	};
}

/**
 * Converts an AgentInstance entity to AgentDTO.
 */
export function agentToDTO(agent: AgentInstance): AgentDTO {
	const stats: Record<string, number> = {};
	for (const [key, value] of agent.effectiveStats.toMap().entries()) {
		stats[key] = value;
	}

	return {
		id: agent.id.value,
		templateId: agent.templateId.value,
		level: agent.level,
		experience: agent.experience,
		stats,
		status: agent.status,
		currentTaskId: agent.currentTaskId?.value
	};
}

/**
 * Converts a TaskInstance entity to TaskInstanceDTO.
 */
export function taskInstanceToDTO(
	task: TaskInstance,
	archetype: TaskArchetype,
	now: Timestamp
): TaskInstanceDTO {
	const startedAt = task.startedAt.value;
	const expectedCompletionAt = task.expectedCompletionAt.value;
	const duration = expectedCompletionAt - startedAt;
	const elapsed = now.value - startedAt;
	const progress = duration > 0 ? Math.min(Math.max(elapsed / duration, 0), 1) : 0;

	return {
		id: task.id.value,
		taskArchetypeId: task.taskArchetypeId.value,
		category: archetype.category,
		assignedAgentIds: task.assignedAgentIds.map((id) => id.value),
		startedAt,
		expectedCompletionAt,
		status: task.status,
		progress
	};
}

