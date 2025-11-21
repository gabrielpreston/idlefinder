<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MissionState } from '$lib/domain/states/MissionState';
	import type { MissionAttributes } from '$lib/domain/attributes/MissionAttributes';

	export let filters: {
		state: MissionState | 'all';
		type: MissionAttributes['missionType'] | 'all';
		search: string;
	} = { state: 'all', type: 'all', search: '' };
	export let sortBy: 'state' | 'duration' | 'rewards' | 'difficulty' | 'startTime' = 'state';

	const dispatch = createEventDispatcher<{
		filterChange: typeof filters;
		sortChange: typeof sortBy;
	}>();

	function handleStateFilterChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newFilters = { ...filters, state: target.value as MissionState | 'all' };
		dispatch('filterChange', newFilters);
	}

	function handleTypeFilterChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newFilters = { ...filters, type: target.value as MissionAttributes['missionType'] | 'all' };
		dispatch('filterChange', newFilters);
	}

	function handleSearchChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newFilters = { ...filters, search: target.value };
		dispatch('filterChange', newFilters);
	}

	function handleSortChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		dispatch('sortChange', target.value as typeof sortBy);
	}
</script>

<div class="mission-toolbar">
	<div class="toolbar-section">
		<label for="state-filter">State:</label>
		<select id="state-filter" onchange={handleStateFilterChange} value={filters.state}>
			<option value="all">All</option>
			<option value="Available">Available</option>
			<option value="InProgress">In Progress</option>
			<option value="Completed">Completed</option>
			<option value="Expired">Expired</option>
		</select>
	</div>
	
	<div class="toolbar-section">
		<label for="type-filter">Type:</label>
		<select id="type-filter" onchange={handleTypeFilterChange} value={filters.type}>
			<option value="all">All</option>
			<option value="combat">Combat</option>
			<option value="exploration">Exploration</option>
			<option value="investigation">Investigation</option>
			<option value="diplomacy">Diplomacy</option>
			<option value="resource">Resource</option>
		</select>
	</div>
	
	<div class="toolbar-section">
		<label for="search">Search:</label>
		<input 
			id="search"
			type="text" 
			placeholder="Mission name..."
			oninput={handleSearchChange}
			value={filters.search}
		/>
	</div>
	
	<div class="toolbar-section">
		<label for="sort">Sort by:</label>
		<select id="sort" onchange={handleSortChange} value={sortBy}>
			<option value="state">State</option>
			<option value="duration">Duration</option>
			<option value="rewards">Rewards</option>
			<option value="difficulty">Difficulty</option>
			<option value="startTime">Start Time</option>
		</select>
	</div>
</div>

<style>
	.mission-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
		margin-bottom: 1.5rem;
		align-items: center;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar-section label {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		white-space: nowrap;
	}

	.toolbar-section select,
	.toolbar-section input {
		padding: 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
	}

	.toolbar-section input {
		min-width: 200px;
	}
</style>

