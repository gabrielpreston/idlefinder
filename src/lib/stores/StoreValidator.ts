/**
 * Store Validator - Utility functions for null checks and validation in stores
 * Provides safe access to stores with helpful error messages
 * 
 * Note: Components should use reactive syntax ($store) and check for null:
 *   if (!$gameState) {
 *     throw new Error('gameState store not initialized');
 *   }
 */

/**
 * Helper function to check if store value is null and throw helpful error
 * Use in components: if (isStoreNull($gameState, 'gameState')) return;
 * 
 * @param value Store value (from $store syntax)
 * @param storeName Name of store for error messages
 * @returns true if null (and throws error), false otherwise
 * @throws Error if value is null
 */
export function requireStoreValue<T>(value: T | null, storeName: string): asserts value is T {
	if (value === null) {
		throw new Error(`Store "${storeName}" is not initialized. Call initialize() first.`);
	}
}

