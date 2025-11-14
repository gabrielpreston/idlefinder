import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { organizationToSnapshot } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type {
	OrganizationId,
	TaskOfferId,
	AgentId
} from '$lib/domain/valueObjects/Identifier';

/**
 * Start task endpoint - starts a task from an offer.
 * Returns task ID and updated organization snapshot.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { organizationId: orgIdString, offerId: offerIdString, agentIds: agentIdStrings } =
		await request.json();

	if (!orgIdString || typeof orgIdString !== 'string') {
		throw error(400, { message: 'organizationId is required' });
	}
	if (!offerIdString || typeof offerIdString !== 'string') {
		throw error(400, { message: 'offerId is required' });
	}
	if (!Array.isArray(agentIdStrings)) {
		throw error(400, { message: 'agentIds must be an array' });
	}

	const { startTaskService, organizationRepo } = createDependencies();

	const organizationId: OrganizationId = Identifier.from(orgIdString);
	const offerId: TaskOfferId = Identifier.from(offerIdString);
	const agentIds: AgentId[] = agentIdStrings.map((id: string) => Identifier.from(id));

	const result = await startTaskService.execute(organizationId, offerId, agentIds);

	if (!result.success) {
		throw error(400, { message: result.error || 'Failed to start task' });
	}

	// Reload organization to get updated state (after gold deduction, etc.)
	const updatedOrg = await organizationRepo.getById(organizationId);
	if (!updatedOrg) {
		throw error(500, { message: 'Failed to reload organization after task start' });
	}

	// Convert to DTO
	const now = Timestamp.now();
	const snapshot = organizationToSnapshot(updatedOrg);

	return json({
		taskId: result.taskId?.value,
		snapshot,
		serverTime: now.value
	});
};

