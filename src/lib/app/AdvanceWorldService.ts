import type {
	OrganizationRepository,
	TaskRepository,
	AgentRepository,
	FacilityRepository,
	ConfigRepository
} from '$lib/repos/contracts';
import { TaskResolutionSystem } from '$lib/domain/systems/TaskResolutionSystem';
import { RosterSystem } from '$lib/domain/systems/RosterSystem';
import { OfferSystem } from '$lib/domain/systems/OfferSystem';
import { ProgressionSystem } from '$lib/domain/systems/ProgressionSystem';
import { EconomySystem } from '$lib/domain/systems/EconomySystem';
import { TaskOffer } from '$lib/domain/entities/TaskOffer';
import { Duration } from '$lib/domain/valueObjects/Duration';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type { OrganizationId } from '$lib/domain/valueObjects/Identifier';

/**
 * Result of advancing the world.
 */
export interface AdvanceResult {
	completedTasks: number;
	newOffers: number;
	updatedAt: Timestamp;
}

/**
 * Application service for advancing the world state.
 * Most critical service - handles all world advancement logic.
 */
export class AdvanceWorldService {
	constructor(
		private organizationRepo: OrganizationRepository,
		private taskRepo: TaskRepository,
		private agentRepo: AgentRepository,
		private facilityRepo: FacilityRepository,
		private configRepo: ConfigRepository,
		private taskResolutionSystem: TaskResolutionSystem,
		private rosterSystem: RosterSystem,
		private offerSystem: OfferSystem,
		private progressionSystem: ProgressionSystem,
		private economySystem: EconomySystem
	) {}

	async advance(organizationId: OrganizationId, now: Timestamp): Promise<AdvanceResult> {
		// 1. Load organization
		const organization = await this.organizationRepo.getById(organizationId);
		if (!organization) {
			throw new Error(`Organization not found: ${organizationId.value}`);
		}

		// 2. Compute delta
		const delta = Duration.between(organization.lastSimulatedAt, now);
		if (delta.toMilliseconds() < 0) {
			throw new Error(
				`Invalid time delta: now (${now.value}) is before lastSimulatedAt (${organization.lastSimulatedAt.value})`
			);
		}

		// 3. Load related state
		const activeTasks = await this.taskRepo.findActiveTasksForOrganization(organizationId);
		const agents = await this.agentRepo.findByOrganization(organizationId);
		const facilities = await this.facilityRepo.findByOrganization(organizationId);
		const allArchetypes = await this.taskRepo.getAllArchetypes();
		const unlockRules = await this.configRepo.getUnlockRules();

		// Create maps for efficient lookup (use string keys to avoid Identifier reference equality issues)
		const agentsMap = new Map(agents.map((agent) => [agent.id.value, agent]));
		const archetypesMap = new Map(allArchetypes.map((archetype) => [archetype.id.value, archetype]));

		// Set templates for facilities (use string keys to avoid Identifier reference equality issues)
		const facilityTemplates = await this.facilityRepo.getAllTemplates();
		const facilityTemplatesMap = new Map(
			facilityTemplates.map((template) => [template.id.value, template])
		);
		for (const facility of facilities) {
			const template = facilityTemplatesMap.get(facility.facilityTemplateId.value);
			if (template) {
				facility.setTemplate(template);
			}
		}

		// 4. Resolve ready tasks
		const readyTasks = activeTasks.filter((task) => task.isReadyForResolution(now));
		const completedTasksCount = readyTasks.length;

		if (readyTasks.length > 0) {
			const resolutionResults = this.taskResolutionSystem.resolveTasks(
				readyTasks,
				agentsMap,
				archetypesMap,
				facilities,
				now
			);

			for (const result of resolutionResults) {
				const task = readyTasks.find((t) => t.id.equals(result.taskId));
				if (!task) {
					continue;
				}

				// Mark task as completed
				task.status = 'COMPLETED';
				task.completedAt = now;
				task.outcomeCategory = result.outcomeCategory;

				// Apply rewards via EconomySystem
				this.economySystem.applyReward(organization, result.rewards);

				// Apply track changes via ProgressionSystem
				if (result.trackChanges.length > 0) {
					this.progressionSystem.applyTrackChanges(organization, result.trackChanges);
				}

				// Apply agent changes (XP, injuries, etc.)
				for (const agentChange of result.agentChanges) {
					const agent = agentsMap.get(agentChange.agentId.value);
					if (!agent) {
						continue;
					}

					// Complete task for agent
					agent.completeTask();

					// Apply XP
					if (agentChange.xpGain) {
						agent.applyXP(agentChange.xpGain);
					}

					// Apply injury
					if (agentChange.injury) {
						agent.markInjured();
					}
				}
			}
		}

		// 5. Update agent recovery
		const agentUpdates = this.rosterSystem.updateAgents(agents, delta, now);
		for (const update of agentUpdates) {
			const agent = agentsMap.get(update.agentId.value);
			if (!agent) {
				continue;
			}

			if (update.statusChange) {
				if (update.statusChange === 'IDLE' && agent.status === 'INJURED') {
					agent.recover();
				}
			}

			if (update.levelUp) {
				agent.levelUp();
			}
		}

		// 6. Clean up expired and taken offers
		await this.taskRepo.deleteExpiredAndTakenOffers(organizationId, now);

		// 7. Generate new offers (only if we don't have enough)
		const existingOffers = await this.taskRepo.findOffersForOrganization(organizationId);
		// Filter out any remaining expired offers (defensive check)
		const validOffers = this.offerSystem.expireOffers(existingOffers, now);
		
		// Only generate new offers if we have fewer than MIN_OFFERS
		// This prevents accumulation of offers
		const newOffers: TaskOffer[] = [];
		if (validOffers.length < this.offerSystem.MIN_OFFERS) {
			const generatedOffers = this.offerSystem.generateOffers(
				organization,
				allArchetypes,
				unlockRules,
				now
			);
			// Only add offers up to MAX_OFFERS total
			const offersNeeded = this.offerSystem.MAX_OFFERS - validOffers.length;
			newOffers.push(...generatedOffers.slice(0, offersNeeded));
		}

		// 8. Process unlocks
		this.progressionSystem.processUnlocks(organization, unlockRules);
		// Track newly unlocked content (for future use in response)

		// 9. Update organization timestamp
		organization.advanceTo(now);

		// 10. Persist all changes
		await this.organizationRepo.save(organization);

		// Save completed tasks
		for (const task of readyTasks) {
			await this.taskRepo.saveInstance(task);
		}

		// Save updated agents
		for (const agent of agents) {
			await this.agentRepo.save(agent);
		}

		// Save new offers
		for (const offer of newOffers) {
			await this.taskRepo.saveOffer(offer);
		}

		// 11. Return AdvanceResult
		return {
			completedTasks: completedTasksCount,
			newOffers: newOffers.length,
			updatedAt: now
		};
	}
}

