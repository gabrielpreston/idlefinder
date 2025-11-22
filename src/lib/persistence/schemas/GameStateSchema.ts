/**
 * GameState DTO Schema - Zod validation schemas for GameStateDTO
 */

import { z } from 'zod';
import { EntityDTOSchema } from './EntitySchema';

/**
 * ResourceBundleDTO Schema - validates resource bundle DTO structure
 */
export const ResourceBundleDTOSchema = z.object({
	resources: z.record(z.string(), z.number()).default({})
});

/**
 * GameStateDTO Schema - validates game state DTO structure
 * Supports version migration by allowing flexible version numbers
 */
export const GameStateDTOSchema = z.object({
	version: z.number(),
	playerId: z.preprocess(
		(val) => (val === '' ? undefined : val),
		z.string().optional().default('player-1')
	),
	lastPlayed: z.string().default(''),
	entities: z.array(EntityDTOSchema).default([]),
	resources: ResourceBundleDTOSchema.default({ resources: {} })
});

/**
 * Inferred types from schemas
 */
export type ResourceBundleDTO = z.infer<typeof ResourceBundleDTOSchema>;
export type GameStateDTO = z.infer<typeof GameStateDTOSchema>;

