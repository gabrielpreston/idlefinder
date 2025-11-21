<script lang="ts">
	import { isGuildHallRuinedState, oddJobsAvailable, oddJobsGoldRate, activeTimers } from '$lib/stores/gameState';
	import ResourceRatesDisplay from './ResourceRatesDisplay.svelte';
	import ResourceStockpilesDisplay from './ResourceStockpilesDisplay.svelte';
	import AdventurerStatusDisplay from './AdventurerStatusDisplay.svelte';
	import TimerList from './TimerList.svelte';
</script>

<div class="dashboard-panel">
	<h2>Dashboard</h2>
	
	{#if $isGuildHallRuinedState}
		<div class="starting-state-banner">
			<p class="ruined-message">This place barely counts as a guild hall.</p>
			{#if $oddJobsAvailable}
				<div class="odd-jobs-info">
					<p>You're working odd jobs to earn gold.</p>
					<p class="gold-rate">Generating {$oddJobsGoldRate.toFixed(1)} gold per minute</p>
				</div>
			{/if}
		</div>
	{/if}
	
	<div class="dashboard-grid">
		<div class="dashboard-section">
			<ResourceRatesDisplay />
		</div>
		
		<div class="dashboard-section">
			<ResourceStockpilesDisplay />
		</div>
		
		<div class="dashboard-section">
			<AdventurerStatusDisplay />
		</div>
		
		<div class="dashboard-section">
			<div class="active-timers-section">
				<h3>Active Timers</h3>
				<TimerList timers={$activeTimers} />
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard-panel {
		padding: 1rem;
	}

	.dashboard-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.starting-state-banner {
		padding: 1rem;
		margin-bottom: 1.5rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.ruined-message {
		font-style: italic;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.5rem;
	}

	.odd-jobs-info {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border, #ddd);
	}

	.gold-rate {
		font-weight: 600;
		color: var(--color-primary, #0066cc);
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.dashboard-section {
		background: var(--color-bg-primary, #fff);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.active-timers-section {
		padding: 1rem;
	}

	.active-timers-section h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-text-secondary, #666);
	}
</style>
