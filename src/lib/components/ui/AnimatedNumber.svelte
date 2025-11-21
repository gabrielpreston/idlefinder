<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let value: number;
	export let duration: number = 500;
	// eslint-disable-next-line no-unused-vars
	export let format: (n: number) => string = (n: number) => n.toLocaleString();

	const animated = tweened(value, {
		duration,
		easing: cubicOut
	});

	$: animated.set(value);
</script>

<span class="animated-number" style="font-variant-numeric: tabular-nums;">
	{format($animated)}
</span>

<style>
	.animated-number {
		display: inline-block;
	}
</style>

