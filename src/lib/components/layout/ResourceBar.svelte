<script lang="ts">
	import { resources } from '$lib/stores/gameState';
</script>

<div class="resource-bar">
	<div class="resource-item">
		<span class="resource-label">Gold:</span>
		<span class="resource-value">{$resources?.get('gold') ?? 0}</span>
	</div>
	<div class="resource-item">
		<span class="resource-label">Fame:</span>
		<span class="resource-value">{$resources?.get('fame') ?? 0}</span>
	</div>
	<div class="resource-item">
		<span class="resource-label">Materials:</span>
		<span class="resource-value">{$resources?.get('materials') ?? 0}</span>
	</div>
	<div class="resource-item">
		<span class="resource-label">Rare Essence:</span>
		<span class="resource-value">{$resources?.get('rareEssence') ?? 0}</span>
	</div>
</div>

<style>
	.resource-bar {
		display: flex;
		gap: 1.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-bottom: 1px solid var(--color-border, #ddd);
		flex-wrap: wrap;
	}

	.resource-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.resource-label {
		font-weight: 600;
		color: var(--color-text-secondary, #666);
	}

	.resource-value {
		font-weight: 700;
		color: var(--color-text-primary, #000);
	}
</style>

