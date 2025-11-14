import { PrismaClient } from '@prisma/client';
import type { AgentRepository } from '../contracts/AgentRepository';
import { AgentInstance, AgentTemplate } from '$lib/domain/entities';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import type {
	AgentId,
	AgentTemplateId,
	OrganizationId
} from '$lib/domain/valueObjects/Identifier';
import {
	jsonToNumericStatMap,
	numericStatMapToJson
} from './mappers';

/**
 * Prisma implementation of AgentRepository.
 */
export class PrismaAgentRepository implements AgentRepository {
	constructor(private prisma: PrismaClient) {}

	async getById(id: AgentId): Promise<AgentInstance | null> {
		const data = await this.prisma.agentInstance.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.instanceToDomain(data);
	}

	async getTemplateById(id: AgentTemplateId): Promise<AgentTemplate | null> {
		const data = await this.prisma.agentTemplate.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.templateToDomain(data);
	}

	async findByOrganization(orgId: OrganizationId): Promise<AgentInstance[]> {
		const data = await this.prisma.agentInstance.findMany({
			where: { organizationId: orgId.value }
		});

		return data.map((item) => this.instanceToDomain(item));
	}

	async getAllTemplates(): Promise<AgentTemplate[]> {
		const data = await this.prisma.agentTemplate.findMany();
		return data.map((item) => this.templateToDomain(item));
	}

	async save(agent: AgentInstance): Promise<void> {
		const data = this.instanceToPrisma(agent);

		await this.prisma.agentInstance.upsert({
			where: { id: agent.id.value },
			create: data,
			update: {
				level: data.level,
				experience: data.experience,
				effectiveStatsData: data.effectiveStatsData,
				status: data.status,
				currentTaskId: data.currentTaskId
			}
		});
	}

	async saveTemplate(template: AgentTemplate): Promise<void> {
		const data = this.templateToPrisma(template);

		await this.prisma.agentTemplate.upsert({
			where: { id: template.id.value },
			create: data,
			update: {
				baseStatsData: data.baseStatsData,
				growthProfileData: data.growthProfileData,
				tagsData: data.tagsData
			}
		});
	}

	private instanceToDomain(data: {
		id: string;
		organizationId: string;
		templateId: string;
		level: number;
		experience: number;
		effectiveStatsData: string;
		status: string;
		currentTaskId: string | null;
	}): AgentInstance {
		const id: AgentId = Identifier.from(data.id);
		const orgId: OrganizationId = Identifier.from(data.organizationId);
		const templateId: AgentTemplateId = Identifier.from(data.templateId);
		const effectiveStats = jsonToNumericStatMap(data.effectiveStatsData);
		const currentTaskId = data.currentTaskId
			? Identifier.from(data.currentTaskId)
			: undefined;

		return new AgentInstance(
			id,
			orgId,
			templateId,
			data.level,
			data.experience,
			effectiveStats,
			data.status as AgentInstance['status'],
			currentTaskId
		);
	}

	private templateToDomain(data: {
		id: string;
		baseStatsData: string;
		growthProfileData: string;
		tagsData: string;
	}): AgentTemplate {
		const id: AgentTemplateId = Identifier.from(data.id);
		const baseStats = jsonToNumericStatMap(data.baseStatsData);

		// Parse growth profile: Map<number, NumericStatMap>
		const growthProfileData = JSON.parse(data.growthProfileData) as Record<
			string,
			Record<string, number>
		>;
		const growthProfile = new Map<number, ReturnType<typeof jsonToNumericStatMap>>();
		for (const [levelStr, statsObj] of Object.entries(growthProfileData)) {
			const level = parseInt(levelStr, 10);
			growthProfile.set(level, jsonToNumericStatMap(JSON.stringify(statsObj)));
		}

		const tags = JSON.parse(data.tagsData) as string[];

		return new AgentTemplate(id, baseStats, growthProfile, tags);
	}

	private instanceToPrisma(agent: AgentInstance): {
		id: string;
		organizationId: string;
		templateId: string;
		level: number;
		experience: number;
		effectiveStatsData: string;
		status: string;
		currentTaskId: string | null;
	} {
		return {
			id: agent.id.value,
			organizationId: agent.organizationId.value,
			templateId: agent.templateId.value,
			level: agent.level,
			experience: agent.experience,
			effectiveStatsData: numericStatMapToJson(agent.effectiveStats),
			status: agent.status,
			currentTaskId: agent.currentTaskId ? agent.currentTaskId.value : null
		};
	}

	private templateToPrisma(template: AgentTemplate): {
		id: string;
		baseStatsData: string;
		growthProfileData: string;
		tagsData: string;
	} {
		// Serialize growth profile: Map<number, NumericStatMap> -> JSON
		const growthProfileObj: Record<string, Record<string, number>> = {};
		for (const [level, stats] of template.growthProfile.entries()) {
			const statsObj: Record<string, number> = {};
			for (const [key, value] of stats.toMap().entries()) {
				statsObj[key] = value;
			}
			growthProfileObj[level.toString()] = statsObj;
		}

		return {
			id: template.id.value,
			baseStatsData: numericStatMapToJson(template.baseStats),
			growthProfileData: JSON.stringify(growthProfileObj),
			tagsData: JSON.stringify(template.tags)
		};
	}
}

