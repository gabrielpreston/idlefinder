<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeBusManager } from '$lib/bus/BusManager';
	import { createInitialPlayerState } from '$lib/domain/entities/PlayerState';
	import { registerHandlers } from '$lib/handlers';
	import { gameState } from '$lib/stores/gameState';
	import '../app.css';

	let { children } = $props();

	onMount(async () => {
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
