import { writable } from 'svelte/store';
import type { OrganizationSnapshot } from '$lib/types';

/**
 * Store for organization snapshot from server.
 */
export const organizationStore = writable<OrganizationSnapshot | null>(null);

/**
 * Store for server timestamp baseline.
 * Used to compute accurate visual progress accounting for client/server clock drift.
 */
export const serverTimeBaseline = writable<number>(Date.now());

/**
 * Updates organization store and server time baseline atomically.
 * Called when receiving data from server heartbeat or bootstrap.
 */
export function updateOrganizationFromServer(
	snapshot: OrganizationSnapshot,
	serverTime: number
): void {
	organizationStore.set(snapshot);
	serverTimeBaseline.set(serverTime);
}

/**
 * Computes visual progress for a task.
 * For MVP: Assumes client and server clocks are synchronized.
 * 
 * The calculation:
 * - `taskStartedAt` and `expectedCompletionAt` are server timestamps (milliseconds since epoch)
 * - Current client time: `Date.now()` (milliseconds since epoch)
 * - For MVP, we assume client and server clocks are synchronized
 * - Elapsed time: `Date.now() - taskStartedAt`
 * - Duration: `expectedCompletionAt - taskStartedAt`
 * - Progress: `elapsed / duration`
 * 
 * Note: `serverTimeBaselineValue` parameter is kept for future clock drift handling,
 * but not used in MVP calculation.
 */
export function computeVisualProgress(
	taskStartedAt: number,
	expectedCompletionAt: number,
	_serverTimeBaselineValue: number
): number {
	const now = Date.now();
	const duration = expectedCompletionAt - taskStartedAt;
	
	if (duration <= 0) {
		return 1.0; // Already complete or invalid duration
	}

	// For MVP: Assume synchronized clocks, compute progress directly
	const elapsed = now - taskStartedAt;
	const progress = elapsed / duration;
	
	// Clamp between 0 and 1
	return Math.min(Math.max(progress, 0), 1);
}

