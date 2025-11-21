/**
 * useCommandError Composable
 *
 * Provides reactive error handling for CommandFailed events.
 * Follows the pattern of createDurationProgressStore from composableValues.ts
 *
 * @param commandTypes Array of command types to listen for failures
 * @param options Configuration options
 * @returns Object with error store, clearError function, and cleanup function
 */

import { writable, type Readable } from 'svelte/store';
import type { CommandType, CommandFailedEvent } from '../bus/types';
import { getRuntime } from '../bus/commandDispatcher';

export interface UseCommandErrorOptions {
	/**
	 * Auto-clear timeout in milliseconds. Default is 5000ms.
	 * Set to null to disable auto-clear (persistent errors).
	 */
	autoClearTimeout?: number | null;
}

export interface UseCommandErrorReturn {
	/** Reactive error store - null when no error, string when error exists */
	error: Readable<string | null>;
	/** Manually clear the error */
	clearError: () => void;
	/** Cleanup function to call in onMount return */
	cleanup: () => void;
}

export function useCommandError(
	commandTypes: CommandType[],
	options?: UseCommandErrorOptions
): UseCommandErrorReturn {
	const runtime = getRuntime();
	if (!runtime) {
		throw new Error('Command dispatcher not initialized. Call initializeCommandDispatcher() first.');
	}

	const errorStore = writable<string | null>(null);
	const autoClearTimeout = options?.autoClearTimeout ?? 5000;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	// Subscribe to CommandFailed events
	const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
		const failed = payload as CommandFailedEvent;
		if (commandTypes.includes(failed.commandType as CommandType)) {
			errorStore.set(failed.reason);

			// Clear existing timeout if any
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			// Set up auto-clear if configured
			if (autoClearTimeout !== null && autoClearTimeout > 0) {
				timeoutId = setTimeout(() => {
					errorStore.set(null);
					timeoutId = null;
				}, autoClearTimeout);
			}
		}
	});

	function clearError() {
		errorStore.set(null);
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function cleanup() {
		unsubscribe();
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	return {
		error: errorStore,
		clearError,
		cleanup
	};
}

