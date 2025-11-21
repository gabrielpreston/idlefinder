/**
 * DOM Query Utilities - Cached queries for test performance
 * Provides cached queries to reduce repeated DOM lookups
 */

import { screen } from '@testing-library/svelte/svelte5';

// Cache for DOM queries
const queryCache = new Map<string, HTMLElement | null>();

/**
 * Clear query cache
 * Call this in test cleanup (afterEach)
 */
export function clearQueryCache(): void {
	queryCache.clear();
}

/**
 * Get mission card by name (cached)
 */
export function getMissionCard(name: string): HTMLElement | null {
	const cacheKey = `mission-card-${name}`;
	if (queryCache.has(cacheKey)) {
		return queryCache.get(cacheKey) || null;
	}
	
	const element = screen.queryByText(name, { selector: '[data-testid="mission-card"], .mission-card' }) as HTMLElement | null;
	queryCache.set(cacheKey, element);
	return element;
}

/**
 * Get filter select by label (cached)
 */
export function getFilterSelect(label: string | RegExp): HTMLSelectElement | null {
	const cacheKey = `filter-select-${label}`;
	if (queryCache.has(cacheKey)) {
		return queryCache.get(cacheKey) as HTMLSelectElement | null;
	}
	
	const element = screen.queryByLabelText(label) as HTMLSelectElement | null;
	queryCache.set(cacheKey, element);
	return element;
}

/**
 * Get sort select (cached)
 */
export function getSortSelect(): HTMLSelectElement | null {
	const cacheKey = 'sort-select';
	if (queryCache.has(cacheKey)) {
		return queryCache.get(cacheKey) as HTMLSelectElement | null;
	}
	
	const element = screen.queryByLabelText(/sort/i) as HTMLSelectElement | null;
	queryCache.set(cacheKey, element);
	return element;
}

/**
 * Get adventurer card by name (cached)
 */
export function getAdventurerCard(name: string): HTMLElement | null {
	const cacheKey = `adventurer-card-${name}`;
	if (queryCache.has(cacheKey)) {
		return queryCache.get(cacheKey) || null;
	}
	
	const element = screen.queryByText(name, { selector: '[data-testid="adventurer-card"], .adventurer-card' }) as HTMLElement | null;
	queryCache.set(cacheKey, element);
	return element;
}

/**
 * Query utilities object for convenience
 */
export const queries = {
	getMissionCard,
	getFilterSelect,
	getSortSelect,
	getAdventurerCard,
	clearCache: clearQueryCache
};

