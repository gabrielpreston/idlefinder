import type {
	TaskInstanceId,
	OrganizationId,
	TaskArchetypeId,
	TaskOfferId,
	AgentId
} from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';

/**
 * Task status types.
 */
export type TaskStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Task outcome categories.
 */
export type OutcomeCategory = 'GREAT_SUCCESS' | 'SUCCESS' | 'FAILURE';

/**
 * Domain entity representing an active task that agents are working on.
 */
export class TaskInstance {
	constructor(
		public readonly id: TaskInstanceId,
		public readonly organizationId: OrganizationId,
		public readonly taskArchetypeId: TaskArchetypeId,
		public readonly startedAt: Timestamp,
		public readonly expectedCompletionAt: Timestamp,
		public status: TaskStatus,
		public readonly originOfferId?: TaskOfferId,
		public readonly assignedAgentIds: AgentId[] = [],
		public completedAt?: Timestamp,
		public outcomeCategory?: OutcomeCategory,
		public outcomeDetails?: unknown
	) {
		if (expectedCompletionAt.isBefore(startedAt)) {
			throw new Error(
				`expectedCompletionAt (${expectedCompletionAt.value}) cannot be before startedAt (${startedAt.value})`
			);
		}
	}

	/**
	 * Checks if the task is ready for resolution.
	 * Task is ready if it's IN_PROGRESS and the current time is >= expectedCompletionAt.
	 */
	isReadyForResolution(now: Timestamp): boolean {
		return this.status === 'IN_PROGRESS' && (now.isAfter(this.expectedCompletionAt) || now.equals(this.expectedCompletionAt));
	}

	/**
	 * Marks the task as completed with the specified outcome.
	 * @param outcome Outcome category
	 * @param details Outcome details
	 * @param completedAt Timestamp when task was completed (must be passed from handler/infrastructure)
	 */
	markCompleted(outcome: OutcomeCategory, details: unknown, completedAt: Timestamp): void {
		if (this.status !== 'IN_PROGRESS') {
			throw new Error(`Cannot mark task as completed: task status is ${this.status}`);
		}
		this.status = 'COMPLETED';
		this.completedAt = completedAt;
		this.outcomeCategory = outcome;
		this.outcomeDetails = details;
	}
}

