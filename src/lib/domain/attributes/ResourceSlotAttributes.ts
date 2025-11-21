/**
 * Resource Slot Attributes - Structured data describing resource slot capabilities
 * Per Systems Primitives Spec section 10.1 lines 296-301
 */

export interface ResourceSlotAttributes {
	facilityId: string;
	resourceType: 'gold' | 'materials' | 'durationModifier';
	baseRatePerMinute: number;
	assigneeType: 'player' | 'adventurer' | 'none';
	assigneeId: string | null;
	/**
	 * Fractional accumulator for accumulating fractional resource generation
	 * Accumulates fractional parts of resources until whole units can be generated
	 * Range: 0 <= fractionalAccumulator < 1
	 */
	fractionalAccumulator: number;
}

