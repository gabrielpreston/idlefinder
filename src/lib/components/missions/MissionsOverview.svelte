<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import ProgressBar from '../ui/ProgressBar.svelte';
	import { missionCapacity, missionStatistics, missionDoctrine } from '$lib/stores/gameState';

	export let onViewAll: () => void = () => {};
	export let onViewState: (_state: 'Available' | 'InProgress' | 'Completed') => void = () => {};

	$: capacity = $missionCapacity;
	$: stats = $missionStatistics;
	$: doctrine = $missionDoctrine;
</script>

<div class="missions-overview">
	<h3>Missions Overview</h3>
	
	<div class="overview-grid">
		<div class="capacity-card">
			<div class="capacity-header">
				<span class="capacity-label">Mission Capacity</span>
				<span class="capacity-value">
					{capacity?.current ?? 0} / {capacity?.max ?? 0}
				</span>
			</div>
			{#if capacity}
				<ProgressBar 
					progress={capacity.utilization} 
					showPercentage={true}
					variant={capacity.utilization >= 0.9 ? 'warning' : capacity.utilization >= 0.7 ? 'default' : 'success'}
				/>
			{/if}
		</div>
		
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
		
		{#if doctrine}
			<StatCard 
				label="Doctrine" 
				value={doctrine.attributes.focus}
				subtitle={`Risk: ${doctrine.attributes.riskTolerance}`}
			/>
		{/if}
	</div>
</div>

<style>
	.missions-overview {
		margin-bottom: 2rem;
	}

	.missions-overview h3 {
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.capacity-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.capacity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.capacity-label {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.capacity-value {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary, #000);
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

