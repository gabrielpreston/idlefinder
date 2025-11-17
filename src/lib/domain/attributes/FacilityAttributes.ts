/**
 * Facility Attributes - Structured data describing facility configuration
 * Per Systems Primitives Spec section 10.3 lines 437-440
 */

export interface FacilityAttributes {
	facilityType: 'Guildhall' | 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot';
	tier: number;
	baseCapacity: number;
	bonusMultipliers: {
		xp?: number;
		resourceGen?: number;
		missionSlots?: number;
	};
}

