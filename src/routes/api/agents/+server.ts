import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { agentToDTO } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type { OrganizationId } from '$lib/domain/valueObjects/Identifier';
import type { AgentDTO } from '$lib/types';

/**
 * Agents endpoint - returns agent roster for organization.
 */
export const GET: RequestHandler = async ({ url }) => {
	const organizationIdParam = url.searchParams.get('organizationId');

	if (!organizationIdParam) {
		throw error(400, { message: 'organizationId query parameter is required' });
	}

	const { agentRepo } = createDependencies();
	const organizationId: OrganizationId = Identifier.from(organizationIdParam);

	const agents = await agentRepo.findByOrganization(organizationId);
	const agentDTOs: AgentDTO[] = agents.map(agentToDTO);

	return json(agentDTOs);
};

