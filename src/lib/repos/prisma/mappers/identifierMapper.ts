import { Identifier } from '$lib/domain/valueObjects/Identifier';

/**
 * Converts an Identifier to a string for Prisma storage.
 */
export function identifierToString<T extends string>(
	identifier: Identifier<T>
): string {
	return identifier.value;
}

/**
 * Converts a string from Prisma to an Identifier.
 */
export function stringToIdentifier<T extends string>(value: string): Identifier<T> {
	return Identifier.from<T>(value);
}

