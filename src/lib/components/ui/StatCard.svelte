<script lang="ts">
	import AnimatedNumber from './AnimatedNumber.svelte';

	export let label: string;
	export let value: number;
	export let icon: string = '';
	export let subtitle: string = '';
	
	/**
	 * Number type for automatic formatting
	 * - 'integer': Always shows as integer (no decimals)
	 * - 'decimal': Shows with decimals
	 */
	export let numberType: 'integer' | 'decimal';
	
	/**
	 * Decimal places for 'decimal' type (default: 1)
	 */
	export let decimalPlaces: number = 1;
	
	/**
	 * Optional custom formatter (overrides numberType)
	 * Use for special cases like rates with units
	 */
	export let format: ((_n: number) => string) | undefined = undefined;
</script>

<div class="stat-card">
	<div class="stat-label">
		{#if icon}
			<span class="stat-icon">{icon}</span>
		{/if}
		{label}
	</div>
	<div class="stat-value">
		<AnimatedNumber 
			{value} 
			{numberType}
			{decimalPlaces}
			{format} 
		/>
	</div>
	{#if subtitle}
		<div class="stat-subtitle">{subtitle}</div>
	{/if}
</div>

<style>
	.stat-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-icon {
		font-size: 1rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary, #000);
	}

	.stat-subtitle {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
		margin-top: 0.25rem;
	}
</style>

