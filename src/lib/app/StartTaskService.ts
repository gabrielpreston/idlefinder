import type {
	OrganizationRepository,
	TaskRepository,
	AgentRepository
} from '$lib/repos/contracts';
import { EconomySystem } from '$lib/domain/systems/EconomySystem';
import { TaskInstance } from '$lib/domain/entities/TaskInstance';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type {
	OrganizationId,
	TaskOfferId,
	AgentId,
	TaskInstanceId
} from '$lib/domain/valueObjects/Identifier';

/**
 * Result of starting a task.
 */
export interface StartTaskResult {
	success: boolean;
	taskId?: TaskInstanceId;
	error?: string;
}

/**
 * Application service for starting a task from an offer.
 */
export class StartTaskService {
	constructor(
	private organizationRepo: OrganizationRepository,
	private taskRepo: TaskRepository,
	private agentRepo: AgentRepository,
	private economySystem: EconomySystem
	) {}

	async execute(
	organizationId: OrganizationId,
	offerId: TaskOfferId,
	agentIds: AgentId[]
	): Promise<StartTaskResult> {
	// 1. Load organization, offer, agents, archetype
	const organization = await this.organizationRepo.getById(organizationId);
	if (!organization) {
		return { success: false, error: 'Organization not found' };
	}

		const offer = await this.taskRepo.getOfferById(offerId);
		if (!offer) {
			return { success: false, error: 'Task offer not found' };
		}

		// Validate offer belongs to organization
		if (!offer.organizationId.equals(organizationId)) {
			return { success: false, error: 'Task offer does not belong to organization' };
		}

		// Validate offer is not taken
		if (offer.isTaken) {
			return { success: false, error: 'Task offer is already taken' };
		}

		// Load archetype
		const archetype = await this.taskRepo.getArchetypeById(offer.taskArchetypeId);
		if (!archetype) {
			return { success: false, error: 'Task archetype not found' };
		}

		// Load agents
		const agents = await Promise.all(
			agentIds.map((id) => this.agentRepo.getById(id))
		);

		// Validate all agents exist
		if (agents.some((agent) => !agent)) {
			return { success: false, error: 'One or more agents not found' };
		}

		const validAgents = agents.filter(
			(agent): agent is NonNullable<typeof agent> => agent !== null
		);

		// 2. Validate agents belong to organization
		for (const agent of validAgents) {
			if (!agent.organizationId.equals(organizationId)) {
				return { success: false, error: 'Agent does not belong to organization' };
			}
		}

		// 3. Validate agents are available (status IDLE)
		for (const agent of validAgents) {
			if (agent.status !== 'IDLE') {
				return { success: false, error: `Agent ${agent.id.value} is not available` };
			}
		}

		// 4. Validate agent count meets archetype requirements
		if (validAgents.length < archetype.minAgents || validAgents.length > archetype.maxAgents) {
			return {
				success: false,
				error: `Agent count must be between ${archetype.minAgents} and ${archetype.maxAgents}`
			};
		}

		// 5. Validate organization can afford entry cost
		if (!this.economySystem.canAfford(organization, archetype.entryCost)) {
			return { success: false, error: 'Organization cannot afford entry cost' };
		}

		// 6. Create TaskInstance
		const now = Timestamp.now();
		const taskId: TaskInstanceId = Identifier.generate();
		const expectedCompletionAt = now.add(archetype.baseDuration);

		const taskInstance = new TaskInstance(
			taskId,
			organizationId,
			archetype.id,
			now,
			expectedCompletionAt,
			'IN_PROGRESS',
			offer.id,
			agentIds
		);

		// 7. Apply costs via EconomySystem
		this.economySystem.applyCost(organization, archetype.entryCost);

		// 8. Mark offer as taken
		offer.markTaken(taskId);

		// 9. Assign agents to task (update agent status)
		for (const agent of validAgents) {
			agent.assignToTask(taskId);
		}

		// 10. Save entities
		await this.organizationRepo.save(organization);
		await this.taskRepo.saveOffer(offer);
		await this.taskRepo.saveInstance(taskInstance);
		for (const agent of validAgents) {
			await this.agentRepo.save(agent);
		}

		return { success: true, taskId };
	}
}

