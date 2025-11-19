/**
 * TaskInstance Entity Tests
 */

import { describe, it, expect } from 'vitest';
import { TaskInstance } from './TaskInstance';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import type {
	TaskInstanceId,
	OrganizationId,
	TaskArchetypeId,
	TaskOfferId,
	AgentId
} from '../valueObjects/Identifier';

function createTestTask(overrides?: {
	startedAt?: Timestamp;
	expectedCompletionAt?: Timestamp;
	status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}): TaskInstance {
	const id = Identifier.generate<'TaskInstanceId'>();
	const orgId = Identifier.generate<'OrganizationId'>();
	const archetypeId = Identifier.generate<'TaskArchetypeId'>();
	const startedAt = overrides?.startedAt || Timestamp.now();
	const expectedCompletionAt = overrides?.expectedCompletionAt || Timestamp.from(startedAt.value + 60000);
	return new TaskInstance(
		id,
		orgId,
		archetypeId,
		startedAt,
		expectedCompletionAt,
		overrides?.status || 'IN_PROGRESS'
	);
}

describe('TaskInstance', () => {
	describe('constructor', () => {
		it('should create valid task instance', () => {
			const task = createTestTask();
			expect(task.status).toBe('IN_PROGRESS');
		});

		it('should throw error when expectedCompletionAt is before startedAt', () => {
			const id = Identifier.generate<'TaskInstanceId'>();
			const orgId = Identifier.generate<'OrganizationId'>();
			const archetypeId = Identifier.generate<'TaskArchetypeId'>();
			const startedAt = Timestamp.now();
			const expectedCompletionAt = Timestamp.from(startedAt.value - 1000);

			expect(() => new TaskInstance(
				id,
				orgId,
				archetypeId,
				startedAt,
				expectedCompletionAt,
				'IN_PROGRESS'
			)).toThrow(/expectedCompletionAt.*cannot be before startedAt/);
		});
	});

	describe('isReadyForResolution', () => {
		it('should return true when task is ready', () => {
			const startedAt = Timestamp.now();
			const expectedCompletionAt = Timestamp.from(startedAt.value + 1000);
			const task = createTestTask({ startedAt, expectedCompletionAt, status: 'IN_PROGRESS' });
			const now = Timestamp.from(startedAt.value + 2000);

			expect(task.isReadyForResolution(now)).toBe(true);
		});

		it('should return true when current time equals expectedCompletionAt', () => {
			const startedAt = Timestamp.now();
			const expectedCompletionAt = Timestamp.from(startedAt.value + 1000);
			const task = createTestTask({ startedAt, expectedCompletionAt, status: 'IN_PROGRESS' });

			expect(task.isReadyForResolution(expectedCompletionAt)).toBe(true);
		});

		it('should return false when task is not IN_PROGRESS', () => {
			const task = createTestTask({ status: 'COMPLETED' });
			const now = Timestamp.now();

			expect(task.isReadyForResolution(now)).toBe(false);
		});

		it('should return false when current time is before expectedCompletionAt', () => {
			const startedAt = Timestamp.now();
			const expectedCompletionAt = Timestamp.from(startedAt.value + 1000);
			const task = createTestTask({ startedAt, expectedCompletionAt, status: 'IN_PROGRESS' });
			const now = Timestamp.from(startedAt.value + 500);

			expect(task.isReadyForResolution(now)).toBe(false);
		});
	});

	describe('markCompleted', () => {
		it('should mark task as completed', () => {
			const task = createTestTask({ status: 'IN_PROGRESS' });
			const completedAt = Timestamp.now();

			task.markCompleted('SUCCESS', { details: 'test' }, completedAt);

			expect(task.status).toBe('COMPLETED');
			expect(task.completedAt).toBe(completedAt);
			expect(task.outcomeCategory).toBe('SUCCESS');
			expect(task.outcomeDetails).toEqual({ details: 'test' });
		});

		it('should throw error when task is not IN_PROGRESS', () => {
			const task = createTestTask({ status: 'COMPLETED' });
			const completedAt = Timestamp.now();

			expect(() => task.markCompleted('SUCCESS', {}, completedAt)).toThrow(
				'Cannot mark task as completed: task status is COMPLETED'
			);
		});
	});
});

