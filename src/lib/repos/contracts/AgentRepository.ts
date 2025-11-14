import type { AgentInstance, AgentTemplate } from '$lib/domain/entities';
import type {
	AgentId,
	AgentTemplateId,
	OrganizationId
} from '$lib/domain/valueObjects/Identifier';

/**
 * Repository interface for Agent persistence.
 */
export interface AgentRepository {
	/**
	 * Gets an agent instance by its ID.
	 */
	getById(id: AgentId): Promise<AgentInstance | null>;

	/**
	 * Gets an agent template by its ID.
	 */
	getTemplateById(id: AgentTemplateId): Promise<AgentTemplate | null>;

	/**
	 * Finds all agent instances for an organization.
	 */
	findByOrganization(orgId: OrganizationId): Promise<AgentInstance[]>;

	/**
	 * Gets all agent templates.
	 */
	getAllTemplates(): Promise<AgentTemplate[]>;

	/**
	 * Saves an agent instance (create or update).
	 */
	save(agent: AgentInstance): Promise<void>;

	/**
	 * Saves an agent template (create or update).
	 */
	saveTemplate(template: AgentTemplate): Promise<void>;
}

