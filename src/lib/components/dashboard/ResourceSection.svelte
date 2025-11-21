<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import { resources, resourceGenerationRates } from '$lib/stores/gameState';

	$: gold = $resources?.get('gold') ?? 0;
	$: fame = $resources?.get('fame') ?? 0;
	$: materials = $resources?.get('materials') ?? 0;
	$: genRates = $resourceGenerationRates;
</script>

<div class="resource-section">
	<h3>Resources</h3>
	<div class="overview-grid">
		<StatCard label="Gold" value={gold} numberType="integer" />
		<StatCard label="Fame" value={fame} numberType="integer" />
		<StatCard label="Materials" value={materials} numberType="integer" />
	</div>
	{#if Object.keys(genRates).length > 0}
		<div class="generation-rates">
			<h4>Generation Rates</h4>
			<div class="rates-list">
				{#each Object.entries(genRates) as [resourceType, rate]}
					<div class="rate-item">
						<span class="rate-label">{resourceType}:</span>
						<span class="rate-value">{rate.toFixed(1)}/min</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.resource-section {
		margin-bottom: 2rem;
	}

	.resource-section h3 {
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.generation-rates {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.generation-rates h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-text-primary, #000);
	}

	.rates-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rate-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.rate-label {
		color: var(--color-text-secondary, #666);
		text-transform: capitalize;
	}

	.rate-value {
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}
</style>

