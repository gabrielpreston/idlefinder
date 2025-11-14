import type {
	FacilityInstanceId,
	OrganizationId,
	FacilityTemplateId
} from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { FacilityTemplate, type EffectDescriptor } from './FacilityTemplate';

/**
 * Domain entity representing a facility instance owned by an organization.
 */
export class FacilityInstance {
	constructor(
		public readonly id: FacilityInstanceId,
		public readonly organizationId: OrganizationId,
		public readonly facilityTemplateId: FacilityTemplateId,
		public currentTier: number,
		public readonly constructedAt: Timestamp,
		public lastUpgradeAt: Timestamp,
		private template?: FacilityTemplate
	) {
		if (currentTier < 0) {
			throw new Error(`Facility currentTier cannot be negative: ${currentTier}`);
		}
	}

	/**
	 * Gets the active effects for the current tier.
	 * Returns effects from the template's tier configuration.
	 */
	getActiveEffects(): EffectDescriptor[] {
		if (!this.template) {
			return [];
		}
		const tierConfig = this.template.tierConfigs.get(this.currentTier);
		return tierConfig?.effects ?? [];
	}

	/**
	 * Checks if the facility can be upgraded.
	 * Returns true if the next tier exists in the template.
	 */
	canUpgrade(): boolean {
		if (!this.template) {
			return false;
		}
		return this.template.tierConfigs.has(this.currentTier + 1);
	}

	/**
	 * Sets the template for this facility instance.
	 * Used to access tier configurations.
	 */
	setTemplate(template: FacilityTemplate): void {
		this.template = template;
	}
}

