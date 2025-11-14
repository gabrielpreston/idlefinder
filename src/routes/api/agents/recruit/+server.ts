import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type { OrganizationId, AgentTemplateId } from '$lib/domain/valueObjects/Identifier';

/**
 * Recruit agent endpoint - recruits a new agent from a template.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { organizationId: orgIdString, templateId: templateIdString } = await request.json();

	if (!orgIdString || typeof orgIdString !== 'string') {
		throw error(400, { message: 'organizationId is required' });
	}
	if (!templateIdString || typeof templateIdString !== 'string') {
		throw error(400, { message: 'templateId is required' });
	}

	const { recruitAgentService } = createDependencies();

	const organizationId: OrganizationId = Identifier.from(orgIdString);
	const templateId: AgentTemplateId = Identifier.from(templateIdString);

	const result = await recruitAgentService.execute(organizationId, templateId);

	if (!result.success) {
		throw error(400, { message: result.error || 'Failed to recruit agent' });
	}

	return json({ agentId: result.agentId?.value });
};

