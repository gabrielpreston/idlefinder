import { describe, it, expect } from 'vitest';
import { TaskOffer } from './TaskOffer';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { Duration } from '$lib/domain/valueObjects/Duration';
import type {
	TaskOfferId,
	OrganizationId,
	TaskArchetypeId,
	TaskInstanceId
} from '$lib/domain/valueObjects/Identifier';

describe('TaskOffer', () => {
	const createOffer = (): TaskOffer => {
		const id: TaskOfferId = Identifier.generate();
		const orgId: OrganizationId = Identifier.generate();
		const archetypeId: TaskArchetypeId = Identifier.generate();
		const createdAt = Timestamp.now();
		return new TaskOffer(id, orgId, archetypeId, createdAt);
	};

	describe('constructor', () => {
		it('should create valid task offer', () => {
			const offer = createOffer();
			expect(offer.isTaken).toBe(false);
			expect(offer.expiresAt).toBeUndefined();
		});

		it('should create offer with expiration', () => {
			const id: TaskOfferId = Identifier.generate();
			const orgId: OrganizationId = Identifier.generate();
			const archetypeId: TaskArchetypeId = Identifier.generate();
			const createdAt = Timestamp.now();
			const expiresAt = createdAt.add(Duration.ofHours(1));
			const offer = new TaskOffer(id, orgId, archetypeId, createdAt, expiresAt);
			expect(offer.expiresAt).toBeDefined();
		});
	});

	describe('markTaken', () => {
		it('should mark offer as taken', () => {
			const offer = createOffer();
			const taskId: TaskInstanceId = Identifier.generate();
			offer.markTaken(taskId);
			expect(offer.isTaken).toBe(true);
			expect(offer.assignedTaskInstanceId).toBe(taskId);
		});

		it('should throw error if already taken', () => {
			const offer = createOffer();
			const taskId1: TaskInstanceId = Identifier.generate();
			const taskId2: TaskInstanceId = Identifier.generate();
			offer.markTaken(taskId1);
			expect(() => offer.markTaken(taskId2)).toThrow('is already taken');
		});
	});

	describe('isExpired', () => {
		it('should return false if no expiration', () => {
			const offer = createOffer();
			expect(offer.isExpired(Timestamp.now())).toBe(false);
		});

		it('should return false if not expired', () => {
			const id: TaskOfferId = Identifier.generate();
			const orgId: OrganizationId = Identifier.generate();
			const archetypeId: TaskArchetypeId = Identifier.generate();
			const createdAt = Timestamp.now();
			const expiresAt = createdAt.add(Duration.ofHours(1));
			const offer = new TaskOffer(id, orgId, archetypeId, createdAt, expiresAt);
			expect(offer.isExpired(createdAt)).toBe(false);
		});

		it('should return true if expired', () => {
			const id: TaskOfferId = Identifier.generate();
			const orgId: OrganizationId = Identifier.generate();
			const archetypeId: TaskArchetypeId = Identifier.generate();
			const createdAt = Timestamp.now();
			const expiresAt = createdAt.add(Duration.ofHours(1));
			const offer = new TaskOffer(id, orgId, archetypeId, createdAt, expiresAt);
			const later = expiresAt.add(Duration.ofSeconds(1));
			expect(offer.isExpired(later)).toBe(true);
		});

		it('should return true if exactly at expiration time', () => {
			const id: TaskOfferId = Identifier.generate();
			const orgId: OrganizationId = Identifier.generate();
			const archetypeId: TaskArchetypeId = Identifier.generate();
			const createdAt = Timestamp.now();
			const expiresAt = createdAt.add(Duration.ofHours(1));
			const offer = new TaskOffer(id, orgId, archetypeId, createdAt, expiresAt);
			expect(offer.isExpired(expiresAt)).toBe(true);
		});
	});
});

