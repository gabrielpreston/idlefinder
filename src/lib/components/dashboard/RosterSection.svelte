<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import CapacityCard from './CapacityCard.svelte';
	import RoleDistributionChart from '../roster/RoleDistributionChart.svelte';
	import { rosterCapacity, rosterStatusSummary, rosterAverageLevel, adventurers } from '$lib/stores/gameState';

	$: capacity = $rosterCapacity;
	$: statusSummary = $rosterStatusSummary;
</script>

<div class="roster-section">
	<h3>Roster</h3>
	<div class="overview-grid">
		<CapacityCard label="Roster Capacity" {capacity} />
		
		<StatCard 
			label="Total Adventurers" 
			value={$adventurers.length}
			numberType="integer"
		/>
		
		<StatCard 
			label="Average Level" 
			value={Math.round($rosterAverageLevel * 10) / 10}
			subtitle="Across all adventurers"
			numberType="decimal"
			decimalPlaces={1}
		/>
		
		{#each Object.entries(statusSummary) as [state, count]}
			<StatCard 
				label={state === 'Idle' ? 'Available' : state === 'OnMission' ? 'On Mission' : state}
				value={count}
				numberType="integer"
			/>
		{/each}
	</div>
	
	<div class="role-distribution-section">
		<RoleDistributionChart />
	</div>
</div>

<style>
	.roster-section {
		margin-bottom: 2rem;
	}

	.roster-section h3 {
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.role-distribution-section {
		margin-top: 1rem;
	}
</style>

