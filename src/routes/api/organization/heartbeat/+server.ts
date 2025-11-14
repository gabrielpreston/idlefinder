import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { organizationToSnapshot } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type { OrganizationId } from '$lib/domain/valueObjects/Identifier';

/**
 * Heartbeat endpoint - advances world for an organization.
 */
export const POST: RequestHandler = async ({ request }) => {
	const { organizationId: orgIdString } = await request.json();

	if (!orgIdString || typeof orgIdString !== 'string') {
		throw error(400, { message: 'organizationId is required' });
	}

	const { advanceWorldService, organizationRepo } = createDependencies();

	const organizationId: OrganizationId = Identifier.from(orgIdString);
	const organization = await organizationRepo.getById(organizationId);

	if (!organization) {
		throw error(404, { message: 'Organization not found' });
	}

	// Advance world to current time
	const now = Timestamp.now();
	await advanceWorldService.advance(organizationId, now);

	// Reload organization to get updated state
	const updatedOrg = await organizationRepo.getById(organizationId);
	if (!updatedOrg) {
		throw error(500, { message: 'Failed to reload organization after advance' });
	}

	// Convert to DTO
	const snapshot = organizationToSnapshot(updatedOrg);

	return json({
		snapshot,
		serverTime: now.value
	});
};

