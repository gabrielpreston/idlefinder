<script lang="ts">
	import { gold, fame, materials } from '$lib/stores/gameState';
	import StatCard from '../ui/StatCard.svelte';
</script>

<div class="resource-stockpiles">
	<h3>Stockpiles</h3>
	<div class="stockpiles-grid">
		<StatCard label="Gold" value={$gold} />
		<StatCard label="Fame" value={$fame} />
		<StatCard label="Materials" value={$materials} />
	</div>
</div>

<style>
	.resource-stockpiles {
		padding: 1rem;
	}

	.resource-stockpiles h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-text-secondary, #666);
	}

	.stockpiles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}
</style>

