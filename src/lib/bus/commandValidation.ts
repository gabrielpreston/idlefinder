/**
 * Command Validation Utilities - Zod-based validation for command payloads
 */

import { CommandSchemas } from './schemas/CommandSchemas';
import type { Command } from './types';

/**
 * Validate command payload using Zod schema
 * @param commandType Command type string
 * @param payload Command payload to validate
 * @returns Validation result with validated payload or error message
 */
export function validateCommand<T extends Command['type']>(
	commandType: T,
	payload: unknown
): { success: true; data: Extract<Command, { type: T }>['payload'] } | { success: false; error: string } {
	const schema = CommandSchemas[commandType];

	const result = schema.safeParse(payload);
	if (!result.success) {
		const errorMessage = result.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join(', ');
		return {
			success: false,
			error: `Invalid ${commandType} command payload: ${errorMessage}`
		};
	}

	// Type assertion needed because Zod's inferred type doesn't match Command union exactly
	return {
		success: true,
		data: result.data as Extract<Command, { type: T }>['payload']
	};
}

/**
 * Type guard to check if validation succeeded
 */
export function isValidatedCommand<T extends Command['type']>(
	result: ReturnType<typeof validateCommand<T>>
): result is { success: true; data: Extract<Command, { type: T }>['payload'] } {
	return result.success;
}

