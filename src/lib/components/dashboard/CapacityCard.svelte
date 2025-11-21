<script lang="ts">
	import ProgressBar from '../ui/ProgressBar.svelte';
	import type { Capacity } from '$lib/domain/queries/Capacity';

	export let label: string;
	export let capacity: Capacity | null;
</script>

<div class="capacity-card">
	<div class="capacity-header">
		<span class="capacity-label">{label}</span>
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

<style>
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
</style>

