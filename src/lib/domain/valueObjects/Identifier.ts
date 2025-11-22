/**
 * Opaque identifier wrapper providing type safety for different ID types.
 * Uses generic type parameter to prevent mixing different ID types.
 */
export class Identifier<T extends string = string> {
	private constructor(public readonly value: string) {}

	/**
	 * Generates a new identifier using crypto.randomUUID()
	 */
	static generate<T extends string>(): Identifier<T> {
		return new Identifier<T>(crypto.randomUUID());
	}

	/**
	 * Creates an identifier from an existing string value.
	 * Validates that the value is non-empty.
	 */
	static from<T extends string>(value: string): Identifier<T> {
		if (!value || value.trim().length === 0) {
			throw new Error('Identifier value cannot be empty');
		}
		return new Identifier<T>(value);
	}

	/**
	 * Checks if this identifier equals another identifier of the same type.
	 */
	equals(other: Identifier<T>): boolean {
		return this.value === other.value;
	}

	/**
	 * Validates that the identifier value is valid (non-empty).
	 */
	isValid(): boolean {
		return this.value.trim().length > 0;
	}
}

// Type aliases for different identifier types
export type AdventurerId = Identifier<'AdventurerId'>;
export type MissionId = Identifier<'MissionId'>;
export type FacilityId = Identifier<'FacilityId'>;
export type ItemId = Identifier<'ItemId'>;
export type CraftingJobId = Identifier<'CraftingJobId'>;
export type CraftingQueueId = Identifier<'CraftingQueueId'>;
export type AutoEquipRulesId = Identifier<'AutoEquipRulesId'>;
export type MissionDoctrineId = Identifier<'MissionDoctrineId'>;
export type SlotId = Identifier<'SlotId'>;

