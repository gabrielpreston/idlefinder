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
		return this.value !== undefined && this.value !== null && this.value.trim().length > 0;
	}
}

// Type aliases for different identifier types
export type OrganizationId = Identifier<'OrganizationId'>;
export type AgentId = Identifier<'AgentId'>;
export type TaskInstanceId = Identifier<'TaskInstanceId'>;
export type TaskOfferId = Identifier<'TaskOfferId'>;
export type TaskArchetypeId = Identifier<'TaskArchetypeId'>;
export type FacilityInstanceId = Identifier<'FacilityInstanceId'>;
export type FacilityTemplateId = Identifier<'FacilityTemplateId'>;
export type ProgressTrackId = Identifier<'ProgressTrackId'>;
export type PlayerId = Identifier<'PlayerId'>;
export type AgentTemplateId = Identifier<'AgentTemplateId'>;

