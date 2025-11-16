<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeBusManager } from '$lib/bus/BusManager';
	import { createInitialPlayerState } from '$lib/domain/entities/PlayerState';
	import { registerHandlers } from '$lib/handlers';
	import { gameState } from '$lib/stores/gameState';
	import '../app.css';

	let { children } = $props();

	onMount(async () => {
		// Check if we're doing a reset (clear any existing singleton first)
		const urlParams = new URLSearchParams(window.location.search);
		const isResetting = urlParams.has('reset') || sessionStorage.getItem('__resetting') === 'true';
		
		if (isResetting) {
			// Reset the singleton to ensure fresh start
			const { resetBusManager } = await import('$lib/bus/BusManager');
			resetBusManager();
			// Clear the reset flag
			sessionStorage.removeItem('__resetting');
			// Clean up URL using SvelteKit's navigation API
			replaceState(window.location.pathname, {});
		}
		
		// Initialize bus manager
		const initialState = createInitialPlayerState('player-1');
		const busManager = initializeBusManager(initialState);

		// Register command handlers
		registerHandlers(busManager);

		// Initialize (loads saved state, handles offline catch-up)
		await busManager.initialize();

		// Initialize game state store
		gameState.refresh();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>
