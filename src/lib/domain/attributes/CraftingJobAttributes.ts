/**
 * Crafting Job Attributes - Data for a crafting job
 * Per plan Phase 3.3
 */

export type CraftingJobStatus = 'queued' | 'in-progress' | 'completed';

export interface CraftingJobAttributes {
	recipeId: string; // Reference to CraftingRecipe template
	status: CraftingJobStatus;
}

