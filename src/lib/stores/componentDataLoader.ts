import { get, type Readable } from 'svelte/store';
import { startDataPolling, PollingTier } from './dataPolling';
import { startVisualTick } from './visualTick';
import { lifecycleEvents } from './lifecycleEvents';

/**
 * Composable utility that encapsulates component data loading pattern.
 * Handles initial load, polling, event listeners, and visual ticks with unified cleanup.
 * 
 * @param loadFn Function to call for loading data (should check for organizationStore internally)
 * @param options Configuration options
 * @param options.pollingTier Polling frequency tier (if undefined, no polling)
 * @param options.events Array of event names to listen to (if undefined, no event listeners)
 * @param options.visualTick Visual tick configuration (if undefined, no visual tick)
 * @param options.checkStore Optional store to check before initial load (e.g., organizationStore)
 * @returns Cleanup function to call in onDestroy()
 */
export function useComponentDataLoader(
	loadFn: () => Promise<void> | void,
	options: {
		pollingTier?: PollingTier;
		events?: string[];
		visualTick?: { updateFn: () => void; interval?: number };
		checkStore?: Readable<unknown>;
	} = {}
): () => void {
	const cleanupFunctions: (() => void)[] = [];

	// Initial load (explicit for clarity, even though polling also does initial load)
	// This ensures consistency when polling is not enabled
	if (!options.checkStore || get(options.checkStore)) {
		loadFn();
	}

	// Polling (if tier specified)
	// Note: startDataPolling also does an initial poll, but explicit initial load above
	// ensures consistency when polling is not enabled
	if (options.pollingTier) {
		const cleanupPolling = startDataPolling(
			loadFn,
			options.pollingTier,
			options.checkStore
		);
		cleanupFunctions.push(cleanupPolling);
	}

	// Event listeners (if events specified)
	if (options.events && options.events.length > 0) {
		const context = { component: 'componentDataLoader' };
		const eventHandlers = options.events.map((eventName) => {
			const handler = () => loadFn();
			return lifecycleEvents.on(eventName, handler, { context });
		});
		cleanupFunctions.push(...eventHandlers);
	}

	// Visual tick (if specified)
	if (options.visualTick) {
		const cleanupTick = startVisualTick(
			options.visualTick.updateFn,
			options.visualTick.interval ?? 100 // Default matches startVisualTick
		);
		cleanupFunctions.push(cleanupTick);
	}

	// Return combined cleanup function
	return () => {
		cleanupFunctions.forEach((cleanup) => cleanup());
	};
}

