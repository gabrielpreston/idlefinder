<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { adventurers } from '$lib/stores/gameState';
	import type { CommandFailedEvent } from '$lib/bus/types';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';
	import RosterOverview from './RosterOverview.svelte';
	import RosterToolbar from './RosterToolbar.svelte';
	import AdventurerGrid from './AdventurerGrid.svelte';
	import AdventurerDetailModal from './AdventurerDetailModal.svelte';
	import RecruitPool from './RecruitPool.svelte';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { AdventurerState } from '$lib/domain/states/AdventurerState';
	import type { RoleKey } from '$lib/domain/attributes/RoleKey';
	import { writable } from 'svelte/store';

	// Get runtime from context
	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let error: string | null = null;
	let selectedAdventurer = writable<Adventurer | null>(null);
	let filters = writable<{
		state: AdventurerState | 'all';
		role: RoleKey | 'all';
		search: string;
	}>({ state: 'all', role: 'all', search: '' });
	let sortBy = writable<'level' | 'xp' | 'name' | 'state'>('level');

	// Subscribe to command failures
	onMount(() => {
		const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
			const failed = payload as CommandFailedEvent;
			if (failed.commandType === 'RecruitAdventurer' || failed.commandType === 'RefreshRecruitPool') {
				error = failed.reason;
			}
		});

		return unsubscribe;
	});

	function handleAdventurerClick(adventurer: Adventurer) {
		selectedAdventurer.set(adventurer);
	}

	function handleModalClose() {
		selectedAdventurer.set(null);
	}

</script>

<div class="roster-panel">
	<h2>Adventurer Roster</h2>
	
	{#if error}
		<div class="error">{error}</div>
	{/if}

	<RecruitPool />

	<RosterOverview />
	
	<RosterToolbar 
		filters={$filters}
		sortBy={$sortBy}
		on:filterChange={(e) => filters.set(e.detail)}
		on:sortChange={(e) => sortBy.set(e.detail)}
	/>
	
	<AdventurerGrid 
		adventurers={$adventurers}
		filters={$filters}
		sortBy={$sortBy}
		onAdventurerClick={handleAdventurerClick}
	/>
</div>

<AdventurerDetailModal 
	adventurer={$selectedAdventurer}
	open={$selectedAdventurer !== null}
	onClose={handleModalClose}
/>

<style>
	.roster-panel {
		padding: 1rem;
	}

	.roster-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.error {
		color: red;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #fee;
		border-radius: 4px;
		border: 1px solid #fcc;
	}
</style>
