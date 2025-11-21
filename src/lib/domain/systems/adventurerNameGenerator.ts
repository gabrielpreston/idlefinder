/**
 * Adventurer Name Generator - Simple name generation for auto-created adventurers
 * 
 * TODO: Enhance with more diverse name generation:
 * - Fantasy name generation (first/last name combinations)
 * - Class/ancestry-based names (e.g., "Thorin Ironforge" for dwarf fighter)
 * - Cultural name variations based on ancestry
 * - Name pools with weighted selection
 */

/**
 * Generate a simple adventurer name from their ID
 * 
 * Uses first 8 characters of UUID (uppercase) to create a unique identifier.
 * Pattern: "Adventurer [SHORT_ID]"
 * 
 * @param adventurerId The adventurer's UUID string
 * @returns Generated name string
 */
export function generateAdventurerName(adventurerId: string): string {
	// Use first 8 characters of UUID for a short identifier
	const shortId = adventurerId.slice(0, 8).toUpperCase();
	return `Adventurer ${shortId}`;
}

