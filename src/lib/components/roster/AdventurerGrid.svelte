<script lang="ts">
	import AdventurerCard from './AdventurerCard.svelte';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { AdventurerState } from '$lib/domain/states/AdventurerState';
	import type { RoleKey } from '$lib/domain/attributes/RoleKey';

	type SortOption = 'level' | 'xp' | 'name' | 'state';
	type RosterFilters = {
		state: AdventurerState | 'all';
		role: RoleKey | 'all';
		search: string;
	};

	export let adventurers: Adventurer[] = [];
	export let filters: RosterFilters = { state: 'all', role: 'all', search: '' };
	export let sortBy: SortOption = 'level';
	// eslint-disable-next-line no-unused-vars
	export let onAdventurerClick: (adventurer: Adventurer) => void = () => {};

	$: filteredAdventurers = adventurers.filter(adventurer => {
		// State filter
		if (filters.state !== 'all' && adventurer.state !== filters.state) {
			return false;
		}
		
		// Role filter
		if (filters.role !== 'all' && adventurer.attributes.roleKey !== filters.role) {
			return false;
		}
		
		// Search filter
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const name = (adventurer.metadata.displayName || adventurer.metadata.name || '').toLowerCase();
			const classKey = adventurer.attributes.classKey.toLowerCase();
			const ancestryKey = adventurer.attributes.ancestryKey.toLowerCase();
			
			if (!name.includes(searchLower) && 
			    !classKey.includes(searchLower) && 
			    !ancestryKey.includes(searchLower)) {
				return false;
			}
		}
		
		return true;
	});

	$: sortedAdventurers = [...filteredAdventurers].sort((a, b) => {
		switch (sortBy) {
			case 'level':
				return b.attributes.level - a.attributes.level;
			case 'xp':
				return b.attributes.xp - a.attributes.xp;
			case 'name': {
				const nameA = (a.metadata.displayName || a.metadata.name || '').toLowerCase();
				const nameB = (b.metadata.displayName || b.metadata.name || '').toLowerCase();
				return nameA.localeCompare(nameB);
			}
			case 'state':
				return a.state.localeCompare(b.state);
			default:
				return 0;
		}
	});
</script>

<div class="adventurer-grid">
	{#if sortedAdventurers.length === 0}
		<div class="empty-state">
			<p>No adventurers match the current filters.</p>
			<p class="empty-hint">Try adjusting your filters or search query.</p>
		</div>
	{:else}
		{#each sortedAdventurers as adventurer}
			<AdventurerCard 
				{adventurer}
				expanded={false}
				onClick={() => onAdventurerClick(adventurer)}
			/>
		{/each}
	{/if}
</div>

<style>
	.adventurer-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.empty-state {
		grid-column: 1 / -1;
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
		background: var(--color-bg-secondary, #f9f9f9);
		border-radius: 8px;
		border: 1px dashed var(--color-border, #ddd);
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.empty-hint {
		font-size: 0.9rem;
		font-style: italic;
	}
</style>

