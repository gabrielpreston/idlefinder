import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { organizationToSnapshot } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type { OrganizationId } from '$lib/domain/valueObjects/Identifier';

/**
 * Organization overview endpoint - returns organization snapshot.
 */
export const GET: RequestHandler = async ({ url }) => {
	const organizationIdParam = url.searchParams.get('organizationId');

	if (!organizationIdParam) {
		throw error(400, { message: 'organizationId query parameter is required' });
	}

	const { organizationRepo } = createDependencies();
	const organizationId: OrganizationId = Identifier.from(organizationIdParam);
	const organization = await organizationRepo.getById(organizationId);

	if (!organization) {
		throw error(404, { message: 'Organization not found' });
	}

	const snapshot = organizationToSnapshot(organization);
	return json(snapshot);
};

