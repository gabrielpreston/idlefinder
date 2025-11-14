import type { FacilityTemplate, FacilityInstance } from '$lib/domain/entities';
import type {
	FacilityTemplateId,
	FacilityInstanceId,
	OrganizationId
} from '$lib/domain/valueObjects/Identifier';

/**
 * Repository interface for Facility persistence.
 */
export interface FacilityRepository {
	/**
	 * Gets a facility template by its ID.
	 */
	getTemplateById(id: FacilityTemplateId): Promise<FacilityTemplate | null>;

	/**
	 * Gets a facility instance by its ID.
	 */
	getInstanceById(id: FacilityInstanceId): Promise<FacilityInstance | null>;

	/**
	 * Gets all facility templates.
	 */
	getAllTemplates(): Promise<FacilityTemplate[]>;

	/**
	 * Finds all facility instances for an organization.
	 */
	findByOrganization(orgId: OrganizationId): Promise<FacilityInstance[]>;

	/**
	 * Saves a facility template (create or update).
	 */
	saveTemplate(template: FacilityTemplate): Promise<void>;

	/**
	 * Saves a facility instance (create or update).
	 */
	saveInstance(instance: FacilityInstance): Promise<void>;
}

