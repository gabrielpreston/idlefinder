import type {
	TaskArchetype,
	TaskOffer,
	TaskInstance
} from '$lib/domain/entities';
import type {
	TaskArchetypeId,
	TaskOfferId,
	TaskInstanceId,
	OrganizationId
} from '$lib/domain/valueObjects/Identifier';
import type { Timestamp } from '$lib/domain/valueObjects/Timestamp';

/**
 * Repository interface for Task persistence.
 */
export interface TaskRepository {
	/**
	 * Gets a task archetype by its ID.
	 */
	getArchetypeById(id: TaskArchetypeId): Promise<TaskArchetype | null>;

	/**
	 * Gets a task offer by its ID.
	 */
	getOfferById(id: TaskOfferId): Promise<TaskOffer | null>;

	/**
	 * Gets a task instance by its ID.
	 */
	getInstanceById(id: TaskInstanceId): Promise<TaskInstance | null>;

	/**
	 * Gets all task archetypes.
	 */
	getAllArchetypes(): Promise<TaskArchetype[]>;

	/**
	 * Finds all task offers for an organization.
	 */
	findOffersForOrganization(orgId: OrganizationId): Promise<TaskOffer[]>;

	/**
	 * Finds all pending tasks ready for resolution at the given timestamp.
	 */
	findPendingTasksReadyForResolution(now: Timestamp): Promise<TaskInstance[]>;

	/**
	 * Finds all active tasks for an organization.
	 */
	findActiveTasksForOrganization(orgId: OrganizationId): Promise<TaskInstance[]>;

	/**
	 * Saves a task archetype (create or update).
	 */
	saveArchetype(archetype: TaskArchetype): Promise<void>;

	/**
	 * Saves a task offer (create or update).
	 */
	saveOffer(offer: TaskOffer): Promise<void>;

	/**
	 * Saves a task instance (create or update).
	 */
	saveInstance(instance: TaskInstance): Promise<void>;

	/**
	 * Deletes expired and taken offers for an organization.
	 */
	deleteExpiredAndTakenOffers(orgId: OrganizationId, now: Timestamp): Promise<number>;
}

