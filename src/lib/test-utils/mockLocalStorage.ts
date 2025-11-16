/**
 * Mock LocalStorage - In-memory localStorage mock for fast tests
 * No real I/O - all operations are instant
 */

import { vi } from 'vitest';

/**
 * Create mock localStorage implementation
 * Returns vitest mock functions that use in-memory Map
 */
export function createMockLocalStorage(): {
	getItem: ReturnType<typeof vi.fn>;
	setItem: ReturnType<typeof vi.fn>;
	removeItem: ReturnType<typeof vi.fn>;
	clear: ReturnType<typeof vi.fn>;
} {
	const storage = new Map<string, string>();

	return {
		getItem: vi.fn((key: string) => storage.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			storage.set(key, value);
		}),
		removeItem: vi.fn((key: string) => {
			storage.delete(key);
		}),
		clear: vi.fn(() => {
			storage.clear();
		})
	};
}

/**
 * Setup global localStorage mock
 * Call this in test setup to replace real localStorage
 */
export function setupMockLocalStorage(): void {
	const mock = createMockLocalStorage();
	global.localStorage = {
		getItem: mock.getItem,
		setItem: mock.setItem,
		removeItem: mock.removeItem,
		clear: mock.clear,
		length: 0,
		key: vi.fn(() => null)
	} as unknown as Storage;
}

