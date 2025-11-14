import type {
	OrganizationRepository,
	FacilityRepository
} from '$lib/repos/contracts';
import { EconomySystem } from '$lib/domain/systems/EconomySystem';
import { ProgressionSystem } from '$lib/domain/systems/ProgressionSystem';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type {
	OrganizationId,
	FacilityInstanceId
} from '$lib/domain/valueObjects/Identifier';

/**
 * Result of upgrading a facility.
 */
export interface UpgradeFacilityResult {
	success: boolean;
	error?: string;
}

/**
 * Application service for upgrading a facility.
 */
export class UpgradeFacilityService {
	constructor(
	private organizationRepo: OrganizationRepository,
	private facilityRepo: FacilityRepository,
	private economySystem: EconomySystem,
	private progressionSystem: ProgressionSystem
	) {}

	async execute(
	organizationId: OrganizationId,
	facilityInstanceId: FacilityInstanceId
	): Promise<UpgradeFacilityResult> {
	// 1. Load organization, facility instance, template
		const organization = await this.organizationRepo.getById(organizationId);
		if (!organization) {
			return { success: false, error: 'Organization not found' };
		}

		const facilityInstance = await this.facilityRepo.getInstanceById(facilityInstanceId);
		if (!facilityInstance) {
			return { success: false, error: 'Facility instance not found' };
		}

		// Validate facility belongs to organization
		if (!facilityInstance.organizationId.equals(organizationId)) {
			return { success: false, error: 'Facility does not belong to organization' };
		}

		const template = await this.facilityRepo.getTemplateById(facilityInstance.facilityTemplateId);
		if (!template) {
			return { success: false, error: 'Facility template not found' };
		}

		// Set template for facility instance to enable canUpgrade check
		facilityInstance.setTemplate(template);

		// 2. Validate facility can upgrade
		if (!facilityInstance.canUpgrade()) {
			return { success: false, error: 'Facility cannot be upgraded further' };
		}

		// 3. Get next tier config
		const nextTier = facilityInstance.currentTier + 1;
		const nextTierConfig = template.tierConfigs.get(nextTier);
		if (!nextTierConfig) {
			return { success: false, error: `Tier ${nextTier} configuration not found` };
		}

		// 4. Validate organization meets required track thresholds
		for (const [trackKey, threshold] of nextTierConfig.requiredTracks.entries()) {
			const track = organization.getProgressTrack(trackKey);
			if (!track || !track.hasReachedThreshold(threshold)) {
				return {
					success: false,
					error: `Required track threshold not met: ${trackKey} >= ${threshold}`
				};
			}
		}

		// 5. Validate organization can afford upgrade cost
		if (!this.economySystem.canAfford(organization, nextTierConfig.buildCost)) {
			return { success: false, error: 'Organization cannot afford upgrade cost' };
		}

		// 6. Upgrade facility
		facilityInstance.currentTier = nextTier;
		facilityInstance.lastUpgradeAt = Timestamp.now();

		// 7. Apply costs
		this.economySystem.applyCost(organization, nextTierConfig.buildCost);

		// 8. Save facility and organization
		await this.facilityRepo.saveInstance(facilityInstance);
		await this.organizationRepo.save(organization);

	return { success: true };
	}
}

