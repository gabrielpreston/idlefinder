import { describe, it, expect } from 'vitest';
import { TaskInstance } from './TaskInstance';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { Duration } from '$lib/domain/valueObjects/Duration';
import type {
	TaskInstanceId,
	OrganizationId,
	TaskArchetypeId
} from '$lib/domain/valueObjects/Identifier';

describe('TaskInstance', () => {
	const createTask = (): TaskInstance => {
		const id: TaskInstanceId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const archetypeId: TaskArchetypeId = Identifier.generate();
		const startedAt = Timestamp.now();
		const expectedCompletionAt = startedAt.add(Duration.ofMinutes(5));
		return new TaskInstance(
			id,
			orgId,
			archetypeId,
			startedAt,
			expectedCompletionAt,
			'IN_PROGRESS'
		);
	};

	describe('constructor', () => {
		it('should create valid task instance', () => {
			const task = createTask();
			expect(task.status).toBe('IN_PROGRESS');
			expect(task.assignedAgentIds).toEqual([]);
		});

		it('should throw error if expectedCompletionAt is before startedAt', () => {
			const id: TaskInstanceId = Identifier.generate();
			const orgId: OrganizationId = Identifier.generate();
			const archetypeId: TaskArchetypeId = Identifier.generate();
			const startedAt = Timestamp.now();
			const expectedCompletionAt = startedAt.subtract(Duration.ofMinutes(1));
			expect(
				() =>
					new TaskInstance(
						id,
						orgId,
						archetypeId,
						startedAt,
						expectedCompletionAt,
						'IN_PROGRESS'
					)
			).toThrow('expectedCompletionAt');
		});
	});

	describe('isReadyForResolution', () => {
		it('should return true when task is ready', () => {
			const task = createTask();
			const later = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			expect(task.isReadyForResolution(later)).toBe(true);
		});

		it('should return true when exactly at completion time', () => {
			const task = createTask();
			expect(task.isReadyForResolution(task.expectedCompletionAt)).toBe(true);
		});

		it('should return false when not yet ready', () => {
			const task = createTask();
			const earlier = task.expectedCompletionAt.subtract(Duration.ofSeconds(1));
			expect(task.isReadyForResolution(earlier)).toBe(false);
		});

		it('should return false when status is not IN_PROGRESS', () => {
			const task = createTask();
			task.status = 'COMPLETED';
			const later = task.expectedCompletionAt.add(Duration.ofSeconds(1));
			expect(task.isReadyForResolution(later)).toBe(false);
		});
	});

	describe('markCompleted', () => {
		it('should mark task as completed', () => {
			const task = createTask();
			task.markCompleted('SUCCESS', { reward: 100 });
			expect(task.status).toBe('COMPLETED');
			expect(task.outcomeCategory).toBe('SUCCESS');
			expect(task.outcomeDetails).toEqual({ reward: 100 });
			expect(task.completedAt).toBeDefined();
		});

		it('should throw error if task is not IN_PROGRESS', () => {
			const task = createTask();
			task.status = 'COMPLETED';
			expect(() => task.markCompleted('SUCCESS', {})).toThrow('Cannot mark task as completed');
		});
	});
});

