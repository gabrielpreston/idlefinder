<script lang="ts">
	import { gameTime } from '$lib/stores/time/timeSource';
	import type { TimerInfo } from '$lib/domain/queries/TimerQueries';
	import TimerItem from './TimerItem.svelte';

	export let timers: TimerInfo[] = [];

	// Store initial time and timers when prop changes
	// gameTime.now is the actual Readable store, so we need to access it properly
	const nowStore = gameTime.now;
	let initialTime = $nowStore;
	let initialTimers: TimerInfo[] = [];

	$: {
		initialTime = $nowStore;
		initialTimers = timers;
	}

	// Limit display to most relevant timers (next 10)
	$: displayTimers = initialTimers.slice(0, 10);
</script>

<div class="timer-list">
	{#if displayTimers.length === 0}
		<div class="empty-state">No active timers</div>
	{:else}
		{#each displayTimers as timer}
			<TimerItem {timer} {initialTime} />
		{/each}
	{/if}
</div>

<style>
	.timer-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 1rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
	}
</style>
