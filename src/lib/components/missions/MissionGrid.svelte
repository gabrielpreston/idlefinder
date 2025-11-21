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

	// Helper function to get state priority for sorting
	function getStatePriority(state: MissionState): number {
		switch (state) {
			case 'InProgress': return 0; // Highest priority
			case 'Available': return 1;
			case 'Completed': return 2;
			case 'Expired': return 3;
			default: return 999;
		}
	}

	$: sortedMissions = [...filteredMissions].sort((a, b) => {
		switch (sortBy) {
			case 'state':
				return getStatePriority(a.state) - getStatePriority(b.state);
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
				// Cross-state sorting: maintain state priority first
				const stateDiff = getStatePriority(a.state) - getStatePriority(b.state);
				if (stateDiff !== 0) return stateDiff;
				
				// Same state - apply state-specific time sorting
				// For Available: sort by availableAt descending (most recent first)
				if (a.state === 'Available' && b.state === 'Available') {
					const aAvailable = a.timers['availableAt'] ?? 0;
					const bAvailable = b.timers['availableAt'] ?? 0;
					return bAvailable - aAvailable; // Descending (most recent first)
				}
				// For InProgress: sort by time remaining (soonest to complete first)
				if (a.state === 'InProgress' && b.state === 'InProgress') {
					const aEnds = a.timers['endsAt'];
					const bEnds = b.timers['endsAt'];
					if (!aEnds && !bEnds) return 0;
					if (!aEnds) return 1;
					if (!bEnds) return -1;
					return aEnds - bEnds; // Ascending (soonest first)
				}
				// For Completed: sort by completion time (most recent first)
				if (a.state === 'Completed' && b.state === 'Completed') {
					const aCompleted = a.timers['completedAt'];
					const bCompleted = b.timers['completedAt'];
					if (!aCompleted && !bCompleted) return 0;
					if (!aCompleted) return 1;
					if (!bCompleted) return -1;
					return bCompleted - aCompleted; // Descending (most recent first)
				}
				// Fallback (should not reach here if all states handled)
				return 0;
			}
			default:
				return 0;
		}
	});
</script>

<div class="mission-grid">
	{#if sortedMissions.length === 0}
		<div class="empty-state">
			<p>No missions match the current filters.</p>
			<p class="empty-hint">Try adjusting your filters or search query.</p>
		</div>
	{:else}
		{#each sortedMissions as mission (mission.id)}
			<MissionCard 
				{mission}
				expanded={false}
				onClick={() => onMissionClick(mission)}
			/>
		{/each}
	{/if}
</div>

<style>
	.mission-grid {
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

