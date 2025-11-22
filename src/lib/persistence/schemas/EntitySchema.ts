/**
 * Entity DTO Schema - Zod validation schemas for EntityDTO
 */

import { z } from 'zod';

/**
 * EntityDTO Schema - validates entity DTO structure
 */
export const EntityDTOSchema = z.object({
	id: z.string(),
	type: z.string(),
	attributes: z.record(z.string(), z.unknown()),
	tags: z.array(z.string()).default([]),
	state: z.string().default(''),
	timers: z.record(z.string(), z.number()).default({}),
	metadata: z.record(z.string(), z.unknown()).default({})
});

/**
 * Inferred type from EntityDTOSchema
 */
export type EntityDTO = z.infer<typeof EntityDTOSchema>;

