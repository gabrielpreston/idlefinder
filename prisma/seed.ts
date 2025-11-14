import { PrismaClient } from '@prisma/client';
import { AgentTemplate } from '../src/lib/domain/entities/AgentTemplate';
import { TaskArchetype } from '../src/lib/domain/entities/TaskArchetype';
import { FacilityTemplate } from '../src/lib/domain/entities/FacilityTemplate';
import { UnlockRule } from '../src/lib/domain/entities/UnlockRule';
import { Identifier } from '../src/lib/domain/valueObjects/Identifier';
import { NumericStatMap } from '../src/lib/domain/valueObjects/NumericStatMap';
import { ResourceBundle, ResourceUnit } from '../src/lib/domain/valueObjects';
import { Duration } from '../src/lib/domain/valueObjects/Duration';
import type {
	AgentTemplateId,
	TaskArchetypeId,
	FacilityTemplateId
} from '../src/lib/domain/valueObjects/Identifier';

const prisma = new PrismaClient();

async function main() {
	console.log('Starting seed...');

	// Seed AgentTemplates
	await seedAgentTemplates();

	// Seed TaskArchetypes
	await seedTaskArchetypes();

	// Seed FacilityTemplates
	await seedFacilityTemplates();

	// Seed UnlockRules
	await seedUnlockRules();

	console.log('Seed data created successfully');
}

async function seedAgentTemplates() {
	console.log('Seeding agent templates...');

	const templates: AgentTemplate[] = [
		// Warrior - High combat stats
		new AgentTemplate(
			Identifier.from<AgentTemplateId>('warrior-template'),
			NumericStatMap.fromMap(
				new Map([
					['strength', 20],
					['combat', 25],
					['endurance', 15]
				])
			),
			new Map(), // No growth profile for MVP
			['combat', 'warrior']
		),
		// Rogue - Balanced stats
		new AgentTemplate(
			Identifier.from<AgentTemplateId>('rogue-template'),
			NumericStatMap.fromMap(
				new Map([
					['agility', 18],
					['stealth', 20],
					['combat', 15]
				])
			),
			new Map(),
			['stealth', 'rogue']
		),
		// Scholar - High research stats
		new AgentTemplate(
			Identifier.from<AgentTemplateId>('scholar-template'),
			NumericStatMap.fromMap(
				new Map([
					['intelligence', 25],
					['research', 22],
					['diplomacy', 12]
				])
			),
			new Map(),
			['research', 'scholar']
		)
	];

	for (const template of templates) {
		await prisma.agentTemplate.upsert({
			where: { id: template.id.value },
			create: {
				id: template.id.value,
				baseStatsData: JSON.stringify(
					Object.fromEntries(template.baseStats.toMap())
				),
				growthProfileData: JSON.stringify({}),
				tagsData: JSON.stringify(template.tags)
			},
			update: {
				baseStatsData: JSON.stringify(
					Object.fromEntries(template.baseStats.toMap())
				),
				growthProfileData: JSON.stringify({}),
				tagsData: JSON.stringify(template.tags)
			}
		});
	}

	console.log(`Created ${templates.length} agent templates`);
}

async function seedTaskArchetypes() {
	console.log('Seeding task archetypes...');

	const archetypes: TaskArchetype[] = [
		// Combat task - short duration, combat-focused
		new TaskArchetype(
			Identifier.from<TaskArchetypeId>('combat-patrol'),
			'combat',
			Duration.ofSeconds(30), // 30 seconds for testing
			1,
			3,
			'combat',
			['strength'],
			ResourceBundle.fromArray([new ResourceUnit('gold', 10)]),
			ResourceBundle.fromArray([new ResourceUnit('gold', 50)]),
			new Map()
		),
		// Research task - longer duration, research-focused
		new TaskArchetype(
			Identifier.from<TaskArchetypeId>('research-project'),
			'research',
			Duration.ofMinutes(2), // 2 minutes
			1,
			2,
			'research',
			['intelligence'],
			ResourceBundle.fromArray([new ResourceUnit('gold', 20)]),
			ResourceBundle.fromArray([new ResourceUnit('gold', 100)]),
			new Map([['research', 10]]) // Requires research track >= 10
		),
		// Exploration task - medium duration
		new TaskArchetype(
			Identifier.from<TaskArchetypeId>('explore-area'),
			'exploration',
			Duration.ofMinutes(1), // 1 minute
			1,
			4,
			'agility',
			['stealth', 'endurance'],
			ResourceBundle.fromArray([new ResourceUnit('gold', 15)]),
			ResourceBundle.fromArray([new ResourceUnit('gold', 75)]),
			new Map([['exploration', 5]]) // Requires exploration track >= 5
		),
		// Diplomacy task - longer duration, diplomacy-focused
		new TaskArchetype(
			Identifier.from<TaskArchetypeId>('diplomatic-mission'),
			'diplomacy',
			Duration.ofMinutes(3), // 3 minutes
			2,
			3,
			'diplomacy',
			['intelligence'],
			ResourceBundle.fromArray([new ResourceUnit('gold', 30)]),
			ResourceBundle.fromArray([new ResourceUnit('gold', 150)]),
			new Map([['diplomacy', 15]]) // Requires diplomacy track >= 15
		),
		// Quick task - very short duration for testing
		new TaskArchetype(
			Identifier.from<TaskArchetypeId>('quick-task'),
			'general',
			Duration.ofSeconds(15), // 15 seconds for quick testing
			1,
			2,
			'strength',
			[],
			ResourceBundle.fromArray([new ResourceUnit('gold', 5)]),
			ResourceBundle.fromArray([new ResourceUnit('gold', 25)]),
			new Map()
		)
	];

	for (const archetype of archetypes) {
		await prisma.taskArchetype.upsert({
			where: { id: archetype.id.value },
			create: {
				id: archetype.id.value,
				category: archetype.category,
				baseDurationMs: archetype.baseDuration.toMilliseconds(),
				minAgents: archetype.minAgents,
				maxAgents: archetype.maxAgents,
				primaryStatKey: archetype.primaryStatKey,
				secondaryStatKeysData: JSON.stringify(archetype.secondaryStatKeys),
				entryCostData: JSON.stringify(
					archetype.entryCost.toArray().map((u) => ({
						resourceType: u.resourceType,
						amount: u.amount
					}))
				),
				baseRewardData: JSON.stringify(
					archetype.baseReward.toArray().map((u) => ({
						resourceType: u.resourceType,
						amount: u.amount
					}))
				),
				requiredTrackThresholdsData: JSON.stringify(
					Object.fromEntries(archetype.requiredTrackThresholds)
				)
			},
			update: {
				category: archetype.category,
				baseDurationMs: archetype.baseDuration.toMilliseconds(),
				minAgents: archetype.minAgents,
				maxAgents: archetype.maxAgents,
				primaryStatKey: archetype.primaryStatKey,
				secondaryStatKeysData: JSON.stringify(archetype.secondaryStatKeys),
				entryCostData: JSON.stringify(
					archetype.entryCost.toArray().map((u) => ({
						resourceType: u.resourceType,
						amount: u.amount
					}))
				),
				baseRewardData: JSON.stringify(
					archetype.baseReward.toArray().map((u) => ({
						resourceType: u.resourceType,
						amount: u.amount
					}))
				),
				requiredTrackThresholdsData: JSON.stringify(
					Object.fromEntries(archetype.requiredTrackThresholds)
				)
			}
		});
	}

	console.log(`Created ${archetypes.length} task archetypes`);
}

async function seedFacilityTemplates() {
	console.log('Seeding facility templates...');

	const templates: FacilityTemplate[] = [
		// Task Control Center - increases max concurrent tasks
		new FacilityTemplate(
			Identifier.from<FacilityTemplateId>('task-control-center'),
			'task-control',
			new Map([
				[
					1,
					{
						buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 500)]),
						requiredTracks: new Map(),
						effects: [
							{
								effectKey: 'maxConcurrentTasks',
								value: 3
							}
						]
					}
				],
				[
					2,
					{
						buildCost: ResourceBundle.fromArray([new ResourceUnit('gold', 1000)]),
						requiredTracks: new Map([['research', 20]]),
						effects: [
							{
								effectKey: 'maxConcurrentTasks',
								value: 5
							}
						]
					}
				]
			])
		)
	];

	for (const template of templates) {
		const tierConfigsObj: Record<
			string,
			{
				buildCost: Array<{ resourceType: string; amount: number }>;
				requiredTracks: Record<string, number>;
				effects: Array<{ effectKey: string; value: number }>;
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

		await prisma.facilityTemplate.upsert({
			where: { id: template.id.value },
			create: {
				id: template.id.value,
				typeKey: template.typeKey,
				tierConfigsData: JSON.stringify(tierConfigsObj)
			},
			update: {
				typeKey: template.typeKey,
				tierConfigsData: JSON.stringify(tierConfigsObj)
			}
		});
	}

	console.log(`Created ${templates.length} facility templates`);
}

async function seedUnlockRules() {
	console.log('Seeding unlock rules...');

	const rules: UnlockRule[] = [
		// Unlock research tasks at research track 10
		new UnlockRule('unlock-research-10', 'research', 10, {
			newTaskArchetypes: [Identifier.from<TaskArchetypeId>('research-project')]
		}),
		// Unlock exploration tasks at exploration track 5
		new UnlockRule('unlock-exploration-5', 'exploration', 5, {
			newTaskArchetypes: [Identifier.from<TaskArchetypeId>('explore-area')]
		}),
		// Unlock diplomacy tasks at diplomacy track 15
		new UnlockRule('unlock-diplomacy-15', 'diplomacy', 15, {
			newTaskArchetypes: [Identifier.from<TaskArchetypeId>('diplomatic-mission')]
		}),
		// Unlock facility upgrade at research track 20
		new UnlockRule('unlock-facility-upgrade-20', 'research', 20, {
			newFacilityTemplates: [Identifier.from<FacilityTemplateId>('task-control-center')]
		})
	];

	for (const rule of rules) {
		const effectsData: {
			newTaskArchetypes?: string[];
			newFacilityTemplates?: string[];
			newAgentTemplates?: string[];
		} = {};

		if (rule.effects.newTaskArchetypes) {
			effectsData.newTaskArchetypes = rule.effects.newTaskArchetypes.map((id) => id.value);
		}
		if (rule.effects.newFacilityTemplates) {
			effectsData.newFacilityTemplates = rule.effects.newFacilityTemplates.map(
				(id) => id.value
			);
		}
		if (rule.effects.newAgentTemplates) {
			effectsData.newAgentTemplates = rule.effects.newAgentTemplates.map((id) => id.value);
		}

		await prisma.unlockRule.upsert({
			where: { id: rule.id },
			create: {
				id: rule.id,
				trackKey: rule.trackKey,
				thresholdValue: rule.thresholdValue,
				effectsData: JSON.stringify(effectsData)
			},
			update: {
				trackKey: rule.trackKey,
				thresholdValue: rule.thresholdValue,
				effectsData: JSON.stringify(effectsData)
			}
		});
	}

	console.log(`Created ${rules.length} unlock rules`);
}

main()
	.catch((error) => {
		console.error('Seed failed:', error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

