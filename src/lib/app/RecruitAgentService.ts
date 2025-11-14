import type { OrganizationRepository, AgentRepository } from '$lib/repos/contracts';
import { EconomySystem } from '$lib/domain/systems/EconomySystem';
import { AgentInstance } from '$lib/domain/entities/AgentInstance';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type { OrganizationId, AgentTemplateId, AgentId } from '$lib/domain/valueObjects/Identifier';

/**
 * Result of recruiting an agent.
 */
export interface RecruitAgentResult {
	success: boolean;
	agentId?: AgentId;
	error?: string;
}

/**
 * Application service for recruiting a new agent.
 * MVP: Simple recruitment with no cost.
 */
export class RecruitAgentService {
	constructor(
	private organizationRepo: OrganizationRepository,
	private agentRepo: AgentRepository,
	private economySystem: EconomySystem
	) {}

	async execute(
	organizationId: OrganizationId,
	templateId: AgentTemplateId
	): Promise<RecruitAgentResult> {
	// 1. Load organization and template
		const organization = await this.organizationRepo.getById(organizationId);
		if (!organization) {
			return { success: false, error: 'Organization not found' };
		}

		const template = await this.agentRepo.getTemplateById(templateId);
		if (!template) {
			return { success: false, error: 'Agent template not found' };
		}

		// 2. Validate (MVP: no cost, so no validation needed)
		// In future: check if organization can afford recruitment cost

		// 3. Create AgentInstance
		const agentId: AgentId = Identifier.generate();
		const effectiveStats = template.baseStats; // Start with base stats

		const agentInstance = new AgentInstance(
			agentId,
			organizationId,
			templateId,
			1, // level
			0, // experience
			effectiveStats,
			'IDLE'
		);

		// 4. Apply costs (MVP: none)
		// In future: apply recruitment cost via EconomySystem

		// 5. Save agent and organization
		await this.agentRepo.save(agentInstance);
		await this.organizationRepo.save(organization);

	return { success: true, agentId };
	}
}

