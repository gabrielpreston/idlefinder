import { Timestamp } from '$lib/domain/valueObjects/Timestamp';

/**
 * Converts a Prisma DateTime to a domain Timestamp.
 */
export function prismaDateTimeToTimestamp(dateTime: Date): Timestamp {
	return Timestamp.from(dateTime);
}

/**
 * Converts a domain Timestamp to a Prisma DateTime.
 */
export function timestampToPrismaDateTime(timestamp: Timestamp): Date {
	return new Date(timestamp.value);
}

