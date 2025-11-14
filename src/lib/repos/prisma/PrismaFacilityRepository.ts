import { PrismaClient } from '@prisma/client';
import type { FacilityRepository } from '../contracts/FacilityRepository';
import { FacilityTemplate, FacilityInstance, type EffectDescriptor } from '$lib/domain/entities';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';
import type {
	FacilityTemplateId,
	FacilityInstanceId,
	OrganizationId
} from '$lib/domain/valueObjects/Identifier';
import {
	prismaDateTimeToTimestamp,
	timestampToPrismaDateTime
} from './mappers';

/**
 * Prisma implementation of FacilityRepository.
 */
export class PrismaFacilityRepository implements FacilityRepository {
	constructor(private prisma: PrismaClient) {}

	async getTemplateById(id: FacilityTemplateId): Promise<FacilityTemplate | null> {
		const data = await this.prisma.facilityTemplate.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.templateToDomain(data);
	}

	async getInstanceById(id: FacilityInstanceId): Promise<FacilityInstance | null> {
		const data = await this.prisma.facilityInstance.findUnique({
			where: { id: id.value }
		});

		if (!data) {
			return null;
		}

		return this.instanceToDomain(data);
	}

	async getAllTemplates(): Promise<FacilityTemplate[]> {
		const data = await this.prisma.facilityTemplate.findMany();
		return data.map((item) => this.templateToDomain(item));
	}

	async findByOrganization(orgId: OrganizationId): Promise<FacilityInstance[]> {
		const data = await this.prisma.facilityInstance.findMany({
			where: { organizationId: orgId.value }
		});

		return data.map((item) => this.instanceToDomain(item));
	}

	async saveTemplate(template: FacilityTemplate): Promise<void> {
		const data = this.templateToPrisma(template);

		await this.prisma.facilityTemplate.upsert({
			where: { id: template.id.value },
			create: data,
			update: {
				typeKey: data.typeKey,
				tierConfigsData: data.tierConfigsData
			}
		});
	}

	async saveInstance(instance: FacilityInstance): Promise<void> {
		const data = this.instanceToPrisma(instance);

		await this.prisma.facilityInstance.upsert({
			where: { id: instance.id.value },
			create: data,
			update: {
				currentTier: data.currentTier,
				lastUpgradeAt: data.lastUpgradeAt
			}
		});
	}

	private templateToDomain(data: {
		id: string;
		typeKey: string;
		tierConfigsData: string;
	}): FacilityTemplate {
		const id: FacilityTemplateId = Identifier.from(data.id);

		// Parse tier configs: Map<number, TierConfig>
		const tierConfigsData = JSON.parse(data.tierConfigsData) as Record<
			string,
			{
				buildCost: Array<{ resourceType: string; amount: number }>;
				requiredTracks: Record<string, number>;
				effects: EffectDescriptor[];
			}
		>;

		const tierConfigs = new Map<
			number,
			{
				buildCost: ResourceBundle;
				requiredTracks: Map<string, number>;
				effects: EffectDescriptor[];
			}
		>();

		for (const [tierStr, config] of Object.entries(tierConfigsData)) {
			const tier = parseInt(tierStr, 10);
			// buildCost is an array of ResourceUnits in JSON
			const buildCostUnits = config.buildCost.map(
				(item) => new ResourceUnit(item.resourceType, item.amount)
			);
			const buildCost = ResourceBundle.fromArray(buildCostUnits);
			const requiredTracks = new Map<string, number>(
				Object.entries(config.requiredTracks)
			);
			tierConfigs.set(tier, {
				buildCost,
				requiredTracks,
				effects: config.effects
			});
		}

		return new FacilityTemplate(id, data.typeKey, tierConfigs);
	}

	private instanceToDomain(data: {
		id: string;
		organizationId: string;
		facilityTemplateId: string;
		currentTier: number;
		constructedAt: Date;
		lastUpgradeAt: Date;
	}): FacilityInstance {
		const id: FacilityInstanceId = Identifier.from(data.id);
		const orgId: OrganizationId = Identifier.from(data.organizationId);
		const templateId: FacilityTemplateId = Identifier.from(data.facilityTemplateId);
		const constructedAt = prismaDateTimeToTimestamp(data.constructedAt);
		const lastUpgradeAt = prismaDateTimeToTimestamp(data.lastUpgradeAt);

		return new FacilityInstance(
			id,
			orgId,
			templateId,
			data.currentTier,
			constructedAt,
			lastUpgradeAt
		);
	}

	private templateToPrisma(template: FacilityTemplate): {
		id: string;
		typeKey: string;
		tierConfigsData: string;
	} {
		// Serialize tier configs: Map<number, TierConfig> -> JSON
		const tierConfigsObj: Record<
			string,
			{
				buildCost: Array<{ resourceType: string; amount: number }>;
				requiredTracks: Record<string, number>;
				effects: EffectDescriptor[];
			}
		> = {};

		for (const [tier, config] of template.tierConfigs.entries()) {
			tierConfigsObj[tier.toString()] = {
				buildCost: config.buildCost.toArray().map((unit) => ({
					resourceType: unit.resourceType,
					amount: unit.amount
				})),
				requiredTracks: Object.fromEntries(config.requiredTracks),
				effects: config.effects
			};
		}

		return {
			id: template.id.value,
			typeKey: template.typeKey,
			tierConfigsData: JSON.stringify(tierConfigsObj)
		};
	}

	private instanceToPrisma(instance: FacilityInstance): {
		id: string;
		organizationId: string;
		facilityTemplateId: string;
		currentTier: number;
		constructedAt: Date;
		lastUpgradeAt: Date;
	} {
		return {
			id: instance.id.value,
			organizationId: instance.organizationId.value,
			facilityTemplateId: instance.facilityTemplateId.value,
			currentTier: instance.currentTier,
			constructedAt: timestampToPrismaDateTime(instance.constructedAt),
			lastUpgradeAt: timestampToPrismaDateTime(instance.lastUpgradeAt)
		};
	}
}

