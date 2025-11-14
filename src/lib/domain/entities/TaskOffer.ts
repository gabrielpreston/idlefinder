import type {
	TaskOfferId,
	OrganizationId,
	TaskArchetypeId,
	TaskInstanceId
} from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';

/**
 * Domain entity representing an available task opportunity for an organization.
 */
export class TaskOffer {
	constructor(
		public readonly id: TaskOfferId,
		public readonly organizationId: OrganizationId,
		public readonly taskArchetypeId: TaskArchetypeId,
		public readonly createdAt: Timestamp,
		public readonly expiresAt?: Timestamp,
		public isTaken: boolean = false,
		public assignedTaskInstanceId?: TaskInstanceId
	) {}

	/**
	 * Marks this offer as taken and assigns it to a task instance.
	 */
	markTaken(taskInstanceId: TaskInstanceId): void {
		if (this.isTaken) {
			throw new Error(`TaskOffer ${this.id.value} is already taken`);
		}
		this.isTaken = true;
		this.assignedTaskInstanceId = taskInstanceId;
	}

	/**
	 * Checks if this offer has expired.
	 */
	isExpired(now: Timestamp): boolean {
		if (!this.expiresAt) {
			return false;
		}
		return now.isAfter(this.expiresAt) || now.equals(this.expiresAt);
	}
}

