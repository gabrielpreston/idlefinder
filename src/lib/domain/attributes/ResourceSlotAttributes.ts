/**
 * Resource Slot Attributes - Structured data describing resource slot capabilities
 * Per Systems Primitives Spec section 10.1 lines 296-301
 */

export interface ResourceSlotAttributes {
	facilityId: string;
	resourceType: 'gold' | 'materials';
	baseRatePerMinute: number;
	assigneeType: 'player' | 'adventurer' | 'none';
	assigneeId: string | null;
}

