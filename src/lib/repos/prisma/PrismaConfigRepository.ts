import { PrismaClient } from '@prisma/client';
import type { ConfigRepository } from '../contracts/ConfigRepository';
import { UnlockRule } from '$lib/domain/entities/UnlockRule';
import type {
	TaskArchetypeId,
	FacilityTemplateId,
	AgentTemplateId
} from '$lib/domain/valueObjects/Identifier';
import { Identifier } from '$lib/domain/valueObjects/Identifier';

/**
 * Prisma implementation of ConfigRepository.
 */
export class PrismaConfigRepository implements ConfigRepository {
	constructor(private prisma: PrismaClient) {}

	async getUnlockRules(): Promise<UnlockRule[]> {
		const data = await this.prisma.unlockRule.findMany();

		return data.map((rule) => {
			const effectsData = JSON.parse(rule.effectsData) as {
				newTaskArchetypes?: string[];
				newFacilityTemplates?: string[];
				newAgentTemplates?: string[];
			};

			const effects: UnlockRule['effects'] = {};

			if (effectsData.newTaskArchetypes) {
				effects.newTaskArchetypes = effectsData.newTaskArchetypes.map(
					(id) => Identifier.from(id) as TaskArchetypeId
				);
			}
			if (effectsData.newFacilityTemplates) {
				effects.newFacilityTemplates = effectsData.newFacilityTemplates.map(
					(id) => Identifier.from(id) as FacilityTemplateId
				);
			}
			if (effectsData.newAgentTemplates) {
				effects.newAgentTemplates = effectsData.newAgentTemplates.map(
					(id) => Identifier.from(id) as AgentTemplateId
				);
			}

			return new UnlockRule(rule.id, rule.trackKey, rule.thresholdValue, effects);
		});
	}
}

