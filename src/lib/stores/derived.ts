import { derived } from 'svelte/store';
import { organizationStore } from './organization';
import type { TaskOfferDTO, AgentDTO, TaskInstanceDTO } from '$lib/types';

/**
 * Derived store for active task instances.
 * Updates automatically when organization updates.
 */
export const activeTasksStore = derived<typeof organizationStore, TaskInstanceDTO[]>(
	organizationStore,
	(_$org) => {
		// In MVP, active tasks are loaded separately via API
		// This store can be populated by components that fetch active tasks
		return [];
	}
);

/**
 * Derived store for available task offers.
 * Updates automatically when organization updates.
 */
export const availableOffersStore = derived<typeof organizationStore, TaskOfferDTO[]>(
	organizationStore,
	(_$org) => {
		// In MVP, offers are loaded separately via API
		// This store can be populated by components that fetch offers
		return [];
	}
);

/**
 * Derived store for agents.
 * Updates automatically when organization updates.
 */
export const agentsStore = derived<typeof organizationStore, AgentDTO[]>(
	organizationStore,
	(_$org) => {
		// In MVP, agents are loaded separately via API
		// This store can be populated by components that fetch agents
		return [];
	}
);

/**
 * Derived store for progress tracks.
 * Extracts progress tracks from organization snapshot.
 */
export const progressTracksStore = derived<typeof organizationStore, Record<string, number>>(
	organizationStore,
	($org) => {
		return $org?.progressTracks ?? {};
	}
);

/**
 * Derived store for wallet.
 * Extracts wallet from organization snapshot.
 */
export const walletStore = derived<typeof organizationStore, Record<string, number>>(
	organizationStore,
	($org) => {
		return $org?.wallet ?? {};
	}
);

