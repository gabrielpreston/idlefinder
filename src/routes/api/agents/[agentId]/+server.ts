import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { agentToDTO } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type { OrganizationId, AgentId } from '$lib/domain/valueObjects/Identifier';

/**
 * Individual agent endpoint - returns a single agent instance by ID.
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const { agentId: agentIdParam } = params;
	const organizationIdParam = url.searchParams.get('organizationId');

	if (!agentIdParam) {
		throw error(400, { message: 'agentId parameter is required' });
	}

	if (!organizationIdParam) {
		throw error(400, { message: 'organizationId query parameter is required' });
	}

	const { agentRepo } = createDependencies();
	const organizationId: OrganizationId = Identifier.from(organizationIdParam);
	const agentId: AgentId = Identifier.from(agentIdParam);

	// Get agent instance
	const agent = await agentRepo.getById(agentId);
	if (!agent) {
		throw error(404, { message: 'Agent not found' });
	}

	// Validate agent belongs to organization
	if (!agent.organizationId.equals(organizationId)) {
		throw error(404, { message: 'Agent not found' });
	}

	// Convert to DTO
	const agentDTO = agentToDTO(agent);

	return json(agentDTO);
};

