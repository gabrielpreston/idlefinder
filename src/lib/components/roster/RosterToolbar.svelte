<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { AdventurerState } from '$lib/domain/states/AdventurerState';
	import type { RoleKey } from '$lib/domain/attributes/RoleKey';

	export let filters: {
		state: AdventurerState | 'all';
		role: RoleKey | 'all';
		search: string;
	} = { state: 'all', role: 'all', search: '' };
	export let sortBy: 'level' | 'xp' | 'name' | 'state' = 'level';

	const dispatch = createEventDispatcher<{
		filterChange: typeof filters;
		sortChange: typeof sortBy;
	}>();

	function handleStateFilterChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newFilters = { ...filters, state: target.value as AdventurerState | 'all' };
		dispatch('filterChange', newFilters);
	}

	function handleRoleFilterChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newFilters = { ...filters, role: target.value as RoleKey | 'all' };
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

<div class="roster-toolbar">
	<div class="toolbar-section">
		<label for="state-filter">State:</label>
		<select id="state-filter" onchange={handleStateFilterChange} value={filters.state}>
			<option value="all">All</option>
			<option value="Idle">Idle</option>
			<option value="OnMission">On Mission</option>
			<option value="AssignedToSlot">Assigned</option>
			<option value="Fatigued">Fatigued</option>
		</select>
	</div>
	
	<div class="toolbar-section">
		<label for="role-filter">Role:</label>
		<select id="role-filter" onchange={handleRoleFilterChange} value={filters.role}>
			<option value="all">All</option>
			<option value="martial_frontliner">Frontliner</option>
			<option value="support_caster">Support</option>
			<option value="utility_caster">Utility</option>
			<option value="ranged_combatant">Ranged</option>
			<option value="skill_specialist">Specialist</option>
		</select>
	</div>
	
	<div class="toolbar-section">
		<label for="search">Search:</label>
		<input 
			id="search"
			type="text" 
			placeholder="Name, class, ancestry..."
			oninput={handleSearchChange}
			value={filters.search}
		/>
	</div>
	
	<div class="toolbar-section">
		<label for="sort">Sort by:</label>
		<select id="sort" onchange={handleSortChange} value={sortBy}>
			<option value="level">Level</option>
			<option value="xp">XP</option>
			<option value="name">Name</option>
			<option value="state">State</option>
		</select>
	</div>
</div>

<style>
	.roster-toolbar {
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

