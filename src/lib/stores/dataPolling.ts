import { get, type Readable } from 'svelte/store';

let visibilityListeners: Set<() => void> = new Set();
let isVisible = true;

/**
 * Polling tiers aligned with idle game best practices:
 * - CRITICAL: 1-2s (task completion, immediate feedback)
 * - HIGH: 3-5s (agent status, offers)
 * - MEDIUM: 10-15s (organization state, resources)
 * - LOW: 30s+ (heartbeat, background sync)
 */
export enum PollingTier {
	CRITICAL = 2000,   // 2 seconds - task completion
	HIGH = 5000,       // 5 seconds - agents, offers
	MEDIUM = 10000,    // 10 seconds - organization state
	LOW = 30000        // 30 seconds - heartbeat
}

/**
 * Handles visibility change events.
 * Shared across all polling instances.
 */
function handleVisibilityChange(): void {
	isVisible = !document.hidden;
	
	// Notify all polling instances
	visibilityListeners.forEach(listener => listener());
}

/**
 * Starts a data polling loop that syncs with server periodically.
 * Follows the same pattern as heartbeat.ts and visualTick.ts.
 * Polls only when tab is visible. Pauses when tab is hidden and resumes when visible.
 * 
 * @param pollFn Function to call on each poll (should check for organizationStore)
 * @param tier Polling frequency tier (default: HIGH)
 * @param checkStore Optional store to check before polling (e.g., organizationStore)
 * @returns Cleanup function to stop polling
 */
export function startDataPolling(
	pollFn: () => Promise<void> | void,
	tier: PollingTier = PollingTier.HIGH,
	checkStore?: Readable<unknown>
): () => void {
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	
	// Set up visibility listener (shared across instances)
	if (visibilityListeners.size === 0) {
		document.addEventListener('visibilitychange', handleVisibilityChange);
		isVisible = !document.hidden;
	}
	
	const visibilityHandler = () => {
		if (isVisible) {
			// Tab became visible - poll immediately if store check passes
			if (!checkStore || get(checkStore)) {
				pollFn();
			}
		}
	};
	
	visibilityListeners.add(visibilityHandler);
	
	// Poll immediately if conditions met
	if (!checkStore || get(checkStore)) {
		pollFn();
	}
	
	// Set up interval for periodic polls
	pollInterval = setInterval(() => {
		if (isVisible && (!checkStore || get(checkStore))) {
			pollFn();
		}
	}, tier);
	
	// Return cleanup function
	return () => {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
		visibilityListeners.delete(visibilityHandler);
		
		// Remove global listener if no more polling instances
		if (visibilityListeners.size === 0) {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	};
}

