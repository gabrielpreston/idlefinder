<script lang="ts">
	import { derived } from 'svelte/store';
	import { gameTime } from '$lib/stores/time/timeSource';
	import { createDurationProgressStore } from '$lib/stores/updates/composableValues';
	import ProgressBar from './ProgressBar.svelte';

	export let startTime: number | string;
	export let duration: number;
	export let label: string = '';

	const start = typeof startTime === 'string'
		? new Date(startTime).getTime()
		: startTime;

	// Validate inputs to prevent NaN values
	const isValid = !isNaN(start) && !isNaN(duration) && duration > 0 && start > 0;

	// Create derived store for duration config
	const config = derived(gameTime.now, () => {
		if (!isValid) {
			// Return a safe default config that shows 0% progress
			return {
				startTime: Date.now(),
				duration: 1
			};
		}
		return {
			startTime: start,
			duration
		};
	});

	const {
		progress,
		timeRemaining,
		isNearComplete
	} = createDurationProgressStore(config, gameTime);
</script>

<div class="duration-progress">
	{#if isValid}
		<ProgressBar
			progress={$progress}
			label={label}
			variant={$isNearComplete ? 'success' : 'default'}
		/>
		<div class="time-info">
			<span class="time-remaining">{$timeRemaining} remaining</span>
		</div>
	{:else}
		<div class="error-message">Invalid mission timer data</div>
	{/if}
</div>

<style>
	.duration-progress {
		width: 100%;
	}

	.time-info {
		margin-top: 0.25rem;
		font-size: 0.85em;
		color: #666;
	}

	.time-remaining {
		font-variant-numeric: tabular-nums;
	}

	.error-message {
		color: #f44336;
		font-size: 0.85em;
		font-style: italic;
	}
</style>

