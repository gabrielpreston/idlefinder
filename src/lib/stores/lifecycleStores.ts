import { writable, get, type Readable, type Writable } from 'svelte/store';
import { organizationStore } from './organization';
import { PollingTier, startDataPolling } from './dataPolling';
import type { TaskInstanceDTO } from '$lib/types';
import type { AgentDTO } from '$lib/types';

/**
 * Registry for managing entity stores and their polling cleanup functions.
 * Prevents duplicate stores for the same entity.
 */
class EntityStoreRegistry {
	private stores = new Map<string, Writable<unknown>>();
	private cleanupFunctions = new Map<string, () => void>();

	/**
	 * Gets or creates a writable store for an entity.
	 */
	getOrCreate<T>(entityType: string, entityId: string): Writable<T | null> {
		const key = `${entityType}:${entityId}`;
		if (!this.stores.has(key)) {
			this.stores.set(key, writable<T | null>(null));
		}
		return this.stores.get(key)! as Writable<T | null>;
	}

	/**
	 * Sets the cleanup function for an entity store.
	 */
	setCleanup(entityType: string, entityId: string, cleanup: () => void): void {
		const key = `${entityType}:${entityId}`;
		this.cleanupFunctions.set(key, cleanup);
	}

	/**
	 * Removes a store from the registry and cleans up polling.
	 */
	remove(entityType: string, entityId: string): void {
		const key = `${entityType}:${entityId}`;
		const cleanup = this.cleanupFunctions.get(key);
		if (cleanup) {
			cleanup();
			this.cleanupFunctions.delete(key);
		}
		this.stores.delete(key);
	}

	/**
	 * Checks if a store exists for an entity.
	 */
	has(entityType: string, entityId: string): boolean {
		const key = `${entityType}:${entityId}`;
		return this.stores.has(key);
	}
}

export const entityStoreRegistry = new EntityStoreRegistry();

/**
 * Options for creating an entity polling store.
 */
export interface EntityPollingOptions {
	/**
	 * Polling interval in milliseconds.
	 * Defaults to PollingTier.HIGH (5000ms).
	 */
	pollInterval?: number;
	/**
	 * Optional store to check before polling (e.g., organizationStore).
	 * Polling will only occur if this store has a truthy value.
	 */
	checkStore?: Readable<unknown>;
}

/**
 * Creates a reactive polling store for an entity.
 * The store automatically polls the fetch function at the specified interval.
 * Returns both the store and a cleanup function.
 * 
 * @param entityType Type identifier for the entity (e.g., 'task', 'agent')
 * @param entityId Unique identifier for the entity
 * @param fetchFn Function to fetch the entity data
 * @param options Polling options
 * @returns Object with store and cleanup function
 */
export function createEntityPollingStore<T>(
	entityType: string,
	entityId: string,
	fetchFn: (id: string) => Promise<T>,
	options: EntityPollingOptions = {}
): { store: Writable<T | null>; cleanup: () => void } {
	const store = entityStoreRegistry.getOrCreate<T>(entityType, entityId);
	const { pollInterval = PollingTier.HIGH, checkStore } = options;

	const poll = async () => {
		try {
			const data = await fetchFn(entityId);
			store.set(data);
		} catch (error) {
			console.error(`[${entityType}] Poll error for ${entityId}:`, error);
		}
	};

	// Set up polling using existing infrastructure
	const cleanup = startDataPolling(poll, pollInterval as PollingTier, checkStore);

	// Store cleanup function in registry
	entityStoreRegistry.setCleanup(entityType, entityId, cleanup);

	return { store, cleanup };
}

/**
 * Creates a reactive polling store for a task instance.
 * Polls every 2 seconds (CRITICAL tier) for active tasks.
 * 
 * @param taskId Task instance ID
 * @returns Writable store that automatically polls task data
 */
export function createTaskStore(taskId: string): Writable<TaskInstanceDTO | null> {
	const { store } = createEntityPollingStore<TaskInstanceDTO>(
		'task',
		taskId,
		async (id) => {
			const org = get(organizationStore);
			if (!org) {
				throw new Error('No organization available');
			}
			const response = await fetch(`/api/tasks/${id}?organizationId=${org.id}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error(`Task ${id} not found`);
				}
				throw new Error(`Failed to fetch task: ${response.statusText}`);
			}
			return await response.json();
		},
		{
			pollInterval: PollingTier.CRITICAL, // 2000ms for active tasks
			checkStore: organizationStore
		}
	);
	return store;
}

/**
 * Creates a reactive polling store for an agent instance.
 * Polls every 5 seconds (HIGH tier) for agent status changes.
 * 
 * @param agentId Agent instance ID
 * @returns Writable store that automatically polls agent data
 */
export function createAgentStore(agentId: string): Writable<AgentDTO | null> {
	const { store } = createEntityPollingStore<AgentDTO>(
		'agent',
		agentId,
		async (id) => {
			const org = get(organizationStore);
			if (!org) {
				throw new Error('No organization available');
			}
			const response = await fetch(`/api/agents/${id}?organizationId=${org.id}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error(`Agent ${id} not found`);
				}
				throw new Error(`Failed to fetch agent: ${response.statusText}`);
			}
			return await response.json();
		},
		{
			pollInterval: PollingTier.HIGH, // 5000ms for agents
			checkStore: organizationStore
		}
	);
	return store;
}

