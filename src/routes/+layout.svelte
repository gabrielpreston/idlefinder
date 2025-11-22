<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import { startGame } from '$lib/runtime/startGame';
	import { createInitialGameState } from '$lib/domain/entities/GameStateFactory';
	import { gameState } from '$lib/stores/gameState';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';
	import { LocalStorageAdapter } from '$lib/persistence/LocalStorageAdapter';
	import { initializeCommandDispatcher } from '$lib/bus/commandDispatcher';
	import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
	import '../app.css';

	let { children } = $props();

	// Create runtime with initial state (for SSR compatibility)
	// Saved state will be loaded in onMount (client-side only)
	// Using Timestamp.now() here is acceptable as this is infrastructure code, not domain
	const initialState = createInitialGameState('player-1', Timestamp.now());
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
				// Ensure required entities exist (e.g., Guildhall for gating)
				const { getGuildHall } = await import('$lib/domain/queries/FacilityQueries');
				const guildhall = getGuildHall(savedState);
				
				if (!guildhall) {
					// Merge initial state's Guildhall into saved state
					const initialState = createInitialGameState('player-1', Timestamp.now());
					const initialGuildhall = getGuildHall(initialState);
					
					if (initialGuildhall) {
						// Add Guildhall to saved state
						const entities = new Map(savedState.entities);
						entities.set(initialGuildhall.id, initialGuildhall);
						
					// Also ensure the initial gold slot exists if it doesn't
					const { EntityQueryBuilder } = await import('$lib/domain/queries/EntityQueryBuilder');
					const { ResourceSlot } = await import('$lib/domain/entities/ResourceSlot');
					const initialStateSlots = EntityQueryBuilder.byType<typeof ResourceSlot>('ResourceSlot')(initialState);
						for (const slot of initialStateSlots) {
							if (!entities.has(slot.id)) {
								entities.set(slot.id, slot);
							}
						}
						
						const migratedState = new (await import('$lib/domain/entities/GameState')).GameState(
							savedState.playerId,
							savedState.lastPlayed,
							entities,
							savedState.resources
						);
						
						runtime.busManager.setState(migratedState);
					} else {
						runtime.busManager.setState(savedState);
					}
				} else {
					// Update runtime state with saved state
					runtime.busManager.setState(savedState);
				}
			}
		}

		// Initialize (handles offline catch-up)
		await runtime.busManager.initialize();

		// Refresh runtime's gameState store to reflect loaded state and catch-up changes
		runtime.refreshGameState();

		// Initialize game state store with runtime
		// This subscribes to domain events for future updates
		gameState.initialize(runtime);

		// Initialize command dispatcher with runtime
		initializeCommandDispatcher(runtime);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>
