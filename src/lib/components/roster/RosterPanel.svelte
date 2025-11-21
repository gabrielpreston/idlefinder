<script lang="ts">
	import { onMount } from 'svelte';
	import { adventurers } from '$lib/stores/gameState';
	import { useCommandError } from '$lib/composables/useCommandError';
	import { ErrorMessage } from '$lib/components/ui';
	import RosterOverview from './RosterOverview.svelte';
	import RosterToolbar from './RosterToolbar.svelte';
	import AdventurerGrid from './AdventurerGrid.svelte';
	import AdventurerDetailModal from './AdventurerDetailModal.svelte';
	import RecruitPool from './RecruitPool.svelte';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { AdventurerState } from '$lib/domain/states/AdventurerState';
	import type { RoleKey } from '$lib/domain/attributes/RoleKey';
	import { writable } from 'svelte/store';

	let selectedAdventurer = writable<Adventurer | null>(null);
	let filters = writable<{
		state: AdventurerState | 'all';
		role: RoleKey | 'all';
		search: string;
	}>({ state: 'all', role: 'all', search: '' });
	let sortBy = writable<'level' | 'xp' | 'name' | 'state'>('level');

	// Use composable for command error handling
	const { error, cleanup } = useCommandError(['RecruitAdventurer', 'RefreshRecruitPool']);

	// Cleanup on component unmount
	onMount(() => {
		return cleanup;
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
	
	<ErrorMessage message={$error} />

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
</style>
