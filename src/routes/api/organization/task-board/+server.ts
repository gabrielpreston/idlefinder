import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { taskOfferToDTO } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type { OrganizationId } from '$lib/domain/valueObjects/Identifier';
import type { TaskOfferDTO } from '$lib/types';

/**
 * Task board endpoint - returns available task offers for organization.
 * Filters out taken and expired offers.
 */
export const GET: RequestHandler = async ({ url }) => {
	const organizationIdParam = url.searchParams.get('organizationId');

	if (!organizationIdParam) {
		throw error(400, { message: 'organizationId query parameter is required' });
	}

	const { taskRepo } = createDependencies();
	const organizationId: OrganizationId = Identifier.from(organizationIdParam);
	const now = Timestamp.now();

	// Load offers and archetypes
	const allOffers = await taskRepo.findOffersForOrganization(organizationId);
	// Filter out expired offers
	const availableOffers = allOffers.filter((offer) => !offer.isExpired(now));
	
	const allArchetypes = await taskRepo.getAllArchetypes();
	// Use .value as Map key since Identifier objects don't compare by value in Map
	const archetypesMap = new Map(allArchetypes.map((a) => [a.id.value, a]));

	// Convert to DTOs
	const offerDTOs: TaskOfferDTO[] = [];
	for (const offer of availableOffers) {
		const archetype = archetypesMap.get(offer.taskArchetypeId.value);
		if (archetype) {
			offerDTOs.push(taskOfferToDTO(offer, archetype));
		}
	}

	return json(offerDTOs);
};

