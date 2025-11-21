<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import CapacityCard from './CapacityCard.svelte';
	import RecentActivityList from './RecentActivityList.svelte';
	import { missionCapacity, missionStatistics, recentCompletions } from '$lib/stores/gameState';

	export let onViewState: (_state: 'Available' | 'InProgress' | 'Completed') => void = () => {};
	export let onViewAll: () => void = () => {};

	$: capacity = $missionCapacity;
	$: stats = $missionStatistics;
</script>

<div class="mission-section">
	<h3>Missions</h3>
	<div class="overview-grid">
		<CapacityCard label="Mission Capacity" {capacity} />
		
		{#if stats}
			<div 
				class="stat-card-clickable"
				onclick={() => onViewState('InProgress')}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onViewState('InProgress');
					}
				}}
			>
				<StatCard 
					label="Active Missions" 
					value={stats.inProgress}
				/>
			</div>
			
			<div 
				class="stat-card-clickable"
				onclick={() => onViewState('Available')}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onViewState('Available');
					}
				}}
			>
				<StatCard 
					label="Available" 
					value={stats.available}
				/>
			</div>
			
			<div 
				class="stat-card-clickable"
				onclick={() => onViewState('Completed')}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onViewState('Completed');
					}
				}}
			>
				<StatCard 
					label="Completed" 
					value={stats.completed}
				/>
			</div>
		{/if}
	</div>
	
	<RecentActivityList 
		missions={$recentCompletions} 
		onViewAll={onViewAll}
		onItemClick={() => onViewState('Completed')}
	/>
</div>

<style>
	.mission-section {
		margin-bottom: 2rem;
	}

	.mission-section h3 {
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card-clickable {
		cursor: pointer;
		transition: transform 0.2s;
	}

	.stat-card-clickable:hover {
		transform: translateY(-2px);
	}

	.stat-card-clickable:focus {
		outline: 2px solid var(--color-primary, #0066cc);
		outline-offset: 2px;
	}
</style>

