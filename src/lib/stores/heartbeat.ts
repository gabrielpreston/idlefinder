import { get } from 'svelte/store';
import { organizationStore, updateOrganizationFromServer } from './organization';

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let isVisible = true;

/**
 * Starts the heartbeat loop that syncs with server periodically.
 * Heartbeat runs every 10 seconds when tab is visible.
 * Pauses when tab is hidden and resumes immediately when visible.
 * 
 * @returns Cleanup function to stop heartbeat
 */
export function startHeartbeat(): () => void {
	// Set up visibility listener
	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Start heartbeat immediately
	performHeartbeat();

	// Set up interval for periodic heartbeats
	heartbeatInterval = setInterval(performHeartbeat, 10000); // 10 seconds

	// Return cleanup function
	return () => {
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
}

/**
 * Performs a heartbeat request to sync with server.
 */
async function performHeartbeat(): Promise<void> {
	if (!isVisible) {
		return;
	}

	const org = get(organizationStore);
	if (!org) {
		return;
	}

	try {
		const response = await fetch('/api/organization/heartbeat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ organizationId: org.id })
		});

		if (!response.ok) {
			console.error('[Heartbeat] Failed:', response.statusText);
			return;
		}

		const data = await response.json();
		updateOrganizationFromServer(data.snapshot, data.serverTime);
	} catch (error) {
		console.error('[Heartbeat] Error:', error);
	}
}

/**
 * Triggers an immediate heartbeat to sync organization state.
 * Can be called by components when they detect state changes (e.g., task completion).
 * 
 * @returns Promise that resolves when heartbeat completes
 */
export async function triggerHeartbeat(): Promise<void> {
	const org = get(organizationStore);
	if (!org) {
		return;
	}

	try {
		const response = await fetch('/api/organization/heartbeat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ organizationId: org.id })
		});

		if (!response.ok) {
			console.error('[Heartbeat] Trigger failed:', response.statusText);
			return;
		}

		const data = await response.json();
		updateOrganizationFromServer(data.snapshot, data.serverTime);
	} catch (error) {
		console.error('[Heartbeat] Trigger error:', error);
	}
}

/**
 * Handles visibility change events.
 * Pauses heartbeat when tab is hidden, resumes when visible.
 */
function handleVisibilityChange(): void {
	isVisible = !document.hidden;

	if (isVisible) {
		// Tab became visible - perform immediate heartbeat to sync
		performHeartbeat();
	}
}

