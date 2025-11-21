<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { formatInteger, formatDecimal } from '$lib/stores/updates/valueTransformers';

	export let value: number;
	export let duration: number = 500;
	
	/**
	 * Number type determines formatting
	 * - 'integer': Always shows as integer (no decimals)
	 * - 'decimal': Shows with decimals (default 1 decimal place)
	 */
	export let numberType: 'integer' | 'decimal';
	
	/**
	 * Decimal places for 'decimal' type (default: 1)
	 */
	export let decimalPlaces: number = 1;
	
	/**
	 * Optional custom formatter (overrides numberType)
	 * Use for special cases like rates with units: (n) => `${n.toFixed(1)}/min`
	 */
	export let format: ((_n: number) => string) | undefined = undefined;

	// Determine the actual formatter to use
	$: actualFormat = format ?? (
		numberType === 'integer' 
			? formatInteger 
			: (n: number) => formatDecimal(n, decimalPlaces)
	);

	const animated = tweened(value, {
		duration,
		easing: cubicOut
	});

	$: animated.set(value);
</script>

<span class="animated-number" style="font-variant-numeric: tabular-nums;">
	{actualFormat($animated)}
</span>

<style>
	.animated-number {
		display: inline-block;
	}
</style>

