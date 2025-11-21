<script lang="ts">
	import MissionCard from './MissionCard.svelte';
	import type { Mission } from '$lib/domain/entities/Mission';
	import type { MissionState } from '$lib/domain/states/MissionState';
	import type { MissionAttributes } from '$lib/domain/attributes/MissionAttributes';

	type SortOption = 'state' | 'duration' | 'rewards' | 'difficulty' | 'startTime';
	type MissionFilters = {
		state: MissionState | 'all';
		type: MissionAttributes['missionType'] | 'all';
		search: string;
	};

	export let missions: Mission[] = [];
	export let filters: MissionFilters = { state: 'all', type: 'all', search: '' };
	export let sortBy: SortOption = 'state';
	// eslint-disable-next-line no-unused-vars
	export let onMissionClick: (mission: Mission) => void = () => {};

	$: filteredMissions = missions.filter(mission => {
		// State filter
		if (filters.state !== 'all' && mission.state !== filters.state) {
			return false;
		}
		
		// Type filter
		if (filters.type !== 'all' && mission.attributes.missionType !== filters.type) {
			return false;
		}
		
		// Search filter
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const name = ((mission.metadata.name as string) || '').toLowerCase();
			
			if (!name.includes(searchLower)) {
				return false;
			}
		}
		
		return true;
	});

	$: sortedMissions = [...filteredMissions].sort((a, b) => {
		switch (sortBy) {
			case 'state':
				return a.state.localeCompare(b.state);
			case 'duration': {
				const aDuration = a.attributes.baseDuration.toMilliseconds();
				const bDuration = b.attributes.baseDuration.toMilliseconds();
				return aDuration - bDuration;
			}
			case 'rewards': {
				const aRewards = a.attributes.baseRewards.gold + a.attributes.baseRewards.xp;
				const bRewards = b.attributes.baseRewards.gold + b.attributes.baseRewards.xp;
				return bRewards - aRewards; // Descending (highest first)
			}
			case 'difficulty': {
				return b.attributes.dc - a.attributes.dc; // Descending (hardest first)
			}
			case 'startTime': {
				const aStart = a.timers['startedAt'];
				const bStart = b.timers['startedAt'];
				if (!aStart && !bStart) return 0;
				if (!aStart) return 1;
				if (!bStart) return -1;
				return bStart - aStart; // Descending (most recent first)
			}
			default:
				return 0;
		}
	});
</script>

<div class="mission-list">
	{#if sortedMissions.length === 0}
		<div class="empty-state">
			<p>No missions match the current filters.</p>
			<p class="empty-hint">Try adjusting your filters or search query.</p>
		</div>
	{:else}
		{#each sortedMissions as mission}
			<MissionCard 
				{mission}
				expanded={false}
				onClick={() => onMissionClick(mission)}
			/>
		{/each}
	{/if}
</div>

<style>
	.mission-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.empty-state {
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

