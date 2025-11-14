import type { Organization } from '$lib/domain/entities/Organization';
import type { OrganizationId, PlayerId } from '$lib/domain/valueObjects/Identifier';

/**
 * Repository interface for Organization persistence.
 */
export interface OrganizationRepository {
	/**
	 * Gets an organization by its ID.
	 */
	getById(id: OrganizationId): Promise<Organization | null>;

	/**
	 * Saves an organization (create or update).
	 */
	save(org: Organization): Promise<void>;

	/**
	 * Finds an organization by owner player ID.
	 */
	findByOwner(ownerPlayerId: PlayerId): Promise<Organization | null>;
}

