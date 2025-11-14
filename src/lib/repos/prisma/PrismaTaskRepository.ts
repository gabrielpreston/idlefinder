import { PrismaClient } from '@prisma/client';
import type { TaskRepository } from '../contracts/TaskRepository';
import { TaskArchetype, TaskOffer, TaskInstance } from '$lib/domain/entities';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { Duration } from '$lib/domain/valueObjects/Duration';
import type {
	TaskArchetypeId,
	TaskOfferId,
	TaskInstanceId,
	OrganizationId,
	AgentId
} from '$lib/domain/valueObjects/Identifier';
import {
	prismaDateTimeToTimestamp,
	timestampToPrismaDateTime,
	jsonToResourceBundle,
	resourceBundleToJson
} from './mappers';

/**
 * Prisma implementation of TaskRepository.
 */
export class PrismaTaskRepository implements TaskRepository {
	constructor(private prisma: PrismaClient) {}

	async getArchetypeById(id: TaskArchetypeId): Promise<TaskArchetype | null> {
		const data = await this.prisma.taskArchetype.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.archetypeToDomain(data);
	}

	async getOfferById(id: TaskOfferId): Promise<TaskOffer | null> {
		const data = await this.prisma.taskOffer.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.offerToDomain(data);
	}

	async getInstanceById(id: TaskInstanceId): Promise<TaskInstance | null> {
		const data = await this.prisma.taskInstance.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.instanceToDomain(data);
	}

	async getAllArchetypes(): Promise<TaskArchetype[]> {
		const data = await this.prisma.taskArchetype.findMany();
		return data.map((item) => this.archetypeToDomain(item));
	}

	async findOffersForOrganization(orgId: OrganizationId): Promise<TaskOffer[]> {
		const now = Timestamp.now();
		const nowDate = timestampToPrismaDateTime(now);
		
		const data = await this.prisma.taskOffer.findMany({
			where: { 
				organizationId: orgId.value,
				isTaken: false, // Only return offers that haven't been taken
				OR: [
					{ expiresAt: null }, // Offers without expiration are always valid
					{ expiresAt: { gt: nowDate } } // Only return offers that haven't expired
				]
			}
		});

		return data.map((item) => this.offerToDomain(item));
	}

	async deleteExpiredAndTakenOffers(orgId: OrganizationId, now: Timestamp): Promise<number> {
		const nowDate = timestampToPrismaDateTime(now);
		
		const result = await this.prisma.taskOffer.deleteMany({
			where: {
				organizationId: orgId.value,
				OR: [
					{ isTaken: true },
					{ expiresAt: { lte: nowDate } }
				]
			}
		});

		return result.count;
	}

	async findPendingTasksReadyForResolution(now: Timestamp): Promise<TaskInstance[]> {
		const nowDate = timestampToPrismaDateTime(now);
		const data = await this.prisma.taskInstance.findMany({
			where: {
				status: 'IN_PROGRESS',
				expectedCompletionAt: {
					lte: nowDate
				}
			}
		});

		return data.map((item) => this.instanceToDomain(item));
	}

	async findActiveTasksForOrganization(orgId: OrganizationId): Promise<TaskInstance[]> {
		const data = await this.prisma.taskInstance.findMany({
			where: {
				organizationId: orgId.value,
				status: 'IN_PROGRESS'
			}
		});

		return data.map((item) => this.instanceToDomain(item));
	}

	async saveArchetype(archetype: TaskArchetype): Promise<void> {
		const data = this.archetypeToPrisma(archetype);

		await this.prisma.taskArchetype.upsert({
			where: { id: archetype.id.value },
			create: data,
			update: {
				category: data.category,
				baseDurationMs: data.baseDurationMs,
				minAgents: data.minAgents,
				maxAgents: data.maxAgents,
				primaryStatKey: data.primaryStatKey,
				secondaryStatKeysData: data.secondaryStatKeysData,
				entryCostData: data.entryCostData,
				baseRewardData: data.baseRewardData,
				requiredTrackThresholdsData: data.requiredTrackThresholdsData
			}
		});
	}

	async saveOffer(offer: TaskOffer): Promise<void> {
		const data = this.offerToPrisma(offer);

		await this.prisma.taskOffer.upsert({
			where: { id: offer.id.value },
			create: data,
			update: {
				isTaken: data.isTaken,
				assignedTaskInstanceId: data.assignedTaskInstanceId
			}
		});
	}

	async saveInstance(instance: TaskInstance): Promise<void> {
		const data = this.instanceToPrisma(instance);

		await this.prisma.taskInstance.upsert({
			where: { id: instance.id.value },
			create: data,
			update: {
				status: data.status,
				completedAt: data.completedAt,
				outcomeCategory: data.outcomeCategory,
				outcomeDetailsData: data.outcomeDetailsData
			}
		});
	}

	private archetypeToDomain(data: {
		id: string;
		category: string;
		baseDurationMs: number;
		minAgents: number;
		maxAgents: number;
		primaryStatKey: string;
		secondaryStatKeysData: string;
		entryCostData: string;
		baseRewardData: string;
		requiredTrackThresholdsData: string;
	}): TaskArchetype {
		const id: TaskArchetypeId = Identifier.from(data.id);
		const baseDuration = Duration.ofSeconds(data.baseDurationMs / 1000);
		const secondaryStatKeys = JSON.parse(data.secondaryStatKeysData) as string[];
		const entryCost = jsonToResourceBundle(data.entryCostData);
		const baseReward = jsonToResourceBundle(data.baseRewardData);
		const requiredTracks = new Map<string, number>(
			Object.entries(JSON.parse(data.requiredTrackThresholdsData) as Record<string, number>)
		);

		return new TaskArchetype(
			id,
			data.category,
			baseDuration,
			data.minAgents,
			data.maxAgents,
			data.primaryStatKey,
			secondaryStatKeys,
			entryCost,
			baseReward,
			requiredTracks
		);
	}

	private offerToDomain(data: {
		id: string;
		organizationId: string;
		taskArchetypeId: string;
		createdAt: Date;
		expiresAt: Date | null;
		isTaken: boolean;
		assignedTaskInstanceId: string | null;
	}): TaskOffer {
		const id: TaskOfferId = Identifier.from(data.id);
		const orgId: OrganizationId = Identifier.from(data.organizationId);
		const archetypeId: TaskArchetypeId = Identifier.from(data.taskArchetypeId);
		const createdAt = prismaDateTimeToTimestamp(data.createdAt);
		const expiresAt = data.expiresAt ? prismaDateTimeToTimestamp(data.expiresAt) : undefined;
		const assignedTaskInstanceId = data.assignedTaskInstanceId
			? (Identifier.from(data.assignedTaskInstanceId) as TaskInstanceId)
			: undefined;

		// Create offer with current state
		const offer = new TaskOffer(
			id,
			orgId,
			archetypeId,
			createdAt,
			expiresAt,
			data.isTaken,
			assignedTaskInstanceId
		);

		return offer;
	}

	private instanceToDomain(data: {
		id: string;
		organizationId: string;
		taskArchetypeId: string;
		originOfferId: string | null;
		assignedAgentIdsData: string;
		startedAt: Date;
		expectedCompletionAt: Date;
		completedAt: Date | null;
		status: string;
		outcomeCategory: string | null;
		outcomeDetailsData: string | null;
	}): TaskInstance {
		const id: TaskInstanceId = Identifier.from(data.id);
		const orgId: OrganizationId = Identifier.from(data.organizationId);
		const archetypeId: TaskArchetypeId = Identifier.from(data.taskArchetypeId);
		const originOfferId = data.originOfferId
			? (Identifier.from(data.originOfferId) as TaskOfferId)
			: undefined;
		const assignedAgentIds = (JSON.parse(data.assignedAgentIdsData) as string[]).map(
			(agentId) => Identifier.from(agentId) as AgentId
		);
		const startedAt = prismaDateTimeToTimestamp(data.startedAt);
		const expectedCompletionAt = prismaDateTimeToTimestamp(data.expectedCompletionAt);
		const completedAt = data.completedAt ? prismaDateTimeToTimestamp(data.completedAt) : undefined;
		const outcomeDetails = data.outcomeDetailsData
			? JSON.parse(data.outcomeDetailsData)
			: undefined;

		const instance = new TaskInstance(
			id,
			orgId,
			archetypeId,
			startedAt,
			expectedCompletionAt,
			data.status as TaskInstance['status'],
			originOfferId,
			assignedAgentIds
		);

		if (completedAt) {
			instance.completedAt = completedAt;
		}
		if (data.outcomeCategory) {
			instance.outcomeCategory = data.outcomeCategory as TaskInstance['outcomeCategory'];
		}
		if (outcomeDetails) {
			instance.outcomeDetails = outcomeDetails;
		}

		return instance;
	}

	private archetypeToPrisma(archetype: TaskArchetype): {
		id: string;
		category: string;
		baseDurationMs: number;
		minAgents: number;
		maxAgents: number;
		primaryStatKey: string;
		secondaryStatKeysData: string;
		entryCostData: string;
		baseRewardData: string;
		requiredTrackThresholdsData: string;
	} {
		return {
			id: archetype.id.value,
			category: archetype.category,
			baseDurationMs: archetype.baseDuration.toMilliseconds(),
			minAgents: archetype.minAgents,
			maxAgents: archetype.maxAgents,
			primaryStatKey: archetype.primaryStatKey,
			secondaryStatKeysData: JSON.stringify(archetype.secondaryStatKeys),
			entryCostData: resourceBundleToJson(archetype.entryCost),
			baseRewardData: resourceBundleToJson(archetype.baseReward),
			requiredTrackThresholdsData: JSON.stringify(
				Object.fromEntries(archetype.requiredTrackThresholds)
			)
		};
	}

	private offerToPrisma(offer: TaskOffer): {
		id: string;
		organizationId: string;
		taskArchetypeId: string;
		createdAt: Date;
		expiresAt: Date | null;
		isTaken: boolean;
		assignedTaskInstanceId: string | null;
	} {
		return {
			id: offer.id.value,
			organizationId: offer.organizationId.value,
			taskArchetypeId: offer.taskArchetypeId.value,
			createdAt: timestampToPrismaDateTime(offer.createdAt),
			expiresAt: offer.expiresAt ? timestampToPrismaDateTime(offer.expiresAt) : null,
			isTaken: offer.isTaken,
			assignedTaskInstanceId: offer.assignedTaskInstanceId
				? offer.assignedTaskInstanceId.value
				: null
		};
	}

	private instanceToPrisma(instance: TaskInstance): {
		id: string;
		organizationId: string;
		taskArchetypeId: string;
		originOfferId: string | null;
		assignedAgentIdsData: string;
		startedAt: Date;
		expectedCompletionAt: Date;
		completedAt: Date | null;
		status: string;
		outcomeCategory: string | null;
		outcomeDetailsData: string | null;
	} {
		return {
			id: instance.id.value,
			organizationId: instance.organizationId.value,
			taskArchetypeId: instance.taskArchetypeId.value,
			originOfferId: instance.originOfferId ? instance.originOfferId.value : null,
			assignedAgentIdsData: JSON.stringify(
				instance.assignedAgentIds.map((id) => id.value)
			),
			startedAt: timestampToPrismaDateTime(instance.startedAt),
			expectedCompletionAt: timestampToPrismaDateTime(instance.expectedCompletionAt),
			completedAt: instance.completedAt
				? timestampToPrismaDateTime(instance.completedAt)
				: null,
			status: instance.status,
			outcomeCategory: instance.outcomeCategory || null,
			outcomeDetailsData: instance.outcomeDetails
				? JSON.stringify(instance.outcomeDetails)
				: null
		};
	}
}

