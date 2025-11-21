<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import ProgressBar from '../ui/ProgressBar.svelte';
	import { rosterCapacity, rosterStatusSummary, rosterAverageLevel } from '$lib/stores/gameState';
	import RoleDistributionChart from './RoleDistributionChart.svelte';

	$: capacity = $rosterCapacity;
	$: statusSummary = $rosterStatusSummary;
</script>

<div class="roster-overview">
	<h3>Roster Overview</h3>
	
	<div class="overview-grid">
		<div class="capacity-card">
			<div class="capacity-header">
				<span class="capacity-label">Roster Capacity</span>
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
		
		<StatCard 
			label="Average Level" 
			value={Math.round($rosterAverageLevel * 10) / 10}
			subtitle="Across all adventurers"
		/>
		
		{#each Object.entries(statusSummary) as [state, count]}
			<StatCard 
				label={state === 'Idle' ? 'Available' : state === 'OnMission' ? 'On Mission' : state}
				value={count}
			/>
		{/each}
	</div>
	
	<div class="role-distribution-section">
		<RoleDistributionChart />
	</div>
</div>

<style>
	.roster-overview {
		margin-bottom: 2rem;
	}

	.roster-overview h3 {
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

	.role-distribution-section {
		margin-top: 1rem;
	}
</style>

