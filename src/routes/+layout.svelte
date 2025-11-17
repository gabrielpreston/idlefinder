<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import { startGame } from '$lib/runtime/startGame';
	import { createInitialGameState } from '$lib/domain/entities/GameStateFactory';
	import { gameState } from '$lib/stores/gameState';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';
	import { LocalStorageAdapter } from '$lib/persistence/LocalStorageAdapter';
	import '../app.css';

	let { children } = $props();

	// Create runtime with initial state (for SSR compatibility)
	// Saved state will be loaded in onMount (client-side only)
	const initialState = createInitialGameState('player-1');
	const runtime = startGame(initialState);

	// Pass runtime via Svelte context (must be synchronous)
	setContext(GAME_RUNTIME_KEY, runtime);

	onMount(async () => {
		// Load saved state on client-side only
		// This prevents data loss on refresh
		if (browser) {
			const adapter = new LocalStorageAdapter();
			const savedState = adapter.load();
			
			if (savedState) {
				// Update runtime state with saved state
				runtime.busManager.setState(savedState);
			}
		}

		// Initialize (handles offline catch-up)
		await runtime.busManager.initialize();

		// Refresh runtime's gameState store to reflect loaded state and catch-up changes
		runtime.refreshGameState();

		// Initialize game state store with runtime
		// This subscribes to domain events for future updates
		gameState.initialize(runtime);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>
