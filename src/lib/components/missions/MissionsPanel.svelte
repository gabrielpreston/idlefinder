<script lang="ts">
	import { writable } from 'svelte/store';
	import MissionsOverview from './MissionsOverview.svelte';
	import MissionToolbar from './MissionToolbar.svelte';
	import MissionList from './MissionList.svelte';
	import MissionDetailModal from './MissionDetailModal.svelte';
	import { missions } from '$lib/stores/gameState';
	import type { Mission } from '$lib/domain/entities/Mission';
	import type { MissionState } from '$lib/domain/states/MissionState';
	import type { MissionAttributes } from '$lib/domain/attributes/MissionAttributes';

	type ViewLevel = 'overview' | 'collection' | 'detail';

	let currentView: ViewLevel = 'overview';
	let selectedMission = writable<Mission | null>(null);
	let filters = writable<{
		state: MissionState | 'all';
		type: MissionAttributes['missionType'] | 'all';
		search: string;
	}>({ state: 'all', type: 'all', search: '' });
	let sortBy = writable<'state' | 'duration' | 'rewards' | 'difficulty' | 'startTime'>('state');

	function handleMissionClick(mission: Mission) {
		selectedMission.set(mission);
		currentView = 'detail';
	}

	function handleModalClose() {
		selectedMission.set(null);
		currentView = 'collection';
	}

	function handleViewAll() {
		currentView = 'collection';
		filters.set({ state: 'all', type: 'all', search: '' });
	}

	function handleViewState(state: 'Available' | 'InProgress' | 'Completed') {
		currentView = 'collection';
		filters.set({ state, type: 'all', search: '' });
		// Set state-aware default sorting
		if (state === 'InProgress') {
			sortBy.set('startTime'); // Sort by time remaining (most recent first)
		} else if (state === 'Completed') {
			sortBy.set('startTime'); // Sort by completion time (most recent first)
		} else {
			sortBy.set('rewards'); // Sort by rewards for Available missions
		}
	}
</script>

<div class="missions-panel">
	<h2>Missions</h2>
	
	{#if currentView === 'overview'}
		<MissionsOverview 
			onViewState={handleViewState}
		/>
		<div class="view-actions">
			<button class="btn-primary" onclick={handleViewAll}>View All Missions</button>
		</div>
	{:else if currentView === 'collection'}
		<div class="collection-header">
			<button class="btn-back" onclick={() => currentView = 'overview'}>← Back to Overview</button>
		</div>
		
		<MissionToolbar 
			filters={$filters}
			sortBy={$sortBy}
			on:filterChange={(e) => filters.set(e.detail)}
			on:sortChange={(e) => sortBy.set(e.detail)}
		/>
		
		<MissionList 
			missions={$missions}
			filters={$filters}
			sortBy={$sortBy}
			onMissionClick={handleMissionClick}
		/>
	{/if}
</div>

<MissionDetailModal 
	mission={$selectedMission}
	open={$selectedMission !== null}
	onClose={handleModalClose}
/>

<style>
	.missions-panel {
		padding: 1rem;
	}

	.missions-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.view-actions {
		margin-top: 1.5rem;
		display: flex;
		justify-content: center;
	}

	.btn-primary {
		padding: 0.75rem 1.5rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: var(--color-primary-dark, #0052a3);
	}

	.collection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.btn-back {
		padding: 0.5rem 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		color: var(--color-text-primary, #000);
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-back:hover {
		background: var(--color-bg-primary, #fff);
	}
</style>
