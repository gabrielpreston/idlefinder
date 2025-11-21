<script lang="ts">
	import { resourceGenerationRates } from '$lib/stores/gameState';
	import StatCard from '../ui/StatCard.svelte';

	// Filter out NaN and zero values reactively
	$: validRates = Object.entries($resourceGenerationRates).filter(
		([_, rate]) => typeof rate === 'number' && !isNaN(rate) && rate > 0
	);
</script>

<div class="resource-rates">
	<h3>Collection Rates</h3>
	<div class="rates-list">
		{#each validRates as [resourceType, rate]}
			<StatCard
				label={resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
				value={rate}
				format={(n) => `${n.toFixed(1)}/min`}
			/>
		{:else}
			<div class="empty-state">No active resource generation</div>
		{/each}
	</div>
</div>

<style>
	.resource-rates {
		padding: 1rem;
	}

	.resource-rates h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-text-secondary, #666);
	}

	.rates-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 0.5rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
		font-size: 0.9rem;
	}
</style>

