<script lang="ts">
	import { derived } from 'svelte/store';
	import { gameTime } from '$lib/stores/time/timeSource';
	import { formatTimeRemaining } from '$lib/stores/updates/valueTransformers';
	import type { TimerInfo } from '$lib/domain/queries/TimerQueries';

	export let timer: TimerInfo;
	export let initialTime: number;

	const remaining = derived(gameTime.now, (currentTime) => {
		const elapsed = currentTime - initialTime;
		return Math.max(0, timer.timeRemaining - elapsed);
	});
	const formatted = formatTimeRemaining(remaining);
</script>

<div class="timer-item">
	<span class="timer-label">{timer.label}</span>
	<span class="timer-time">{$formatted}</span>
</div>

<style>
	.timer-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.timer-label {
		color: var(--color-text-primary, #000);
		flex: 1;
	}

	.timer-time {
		color: var(--color-primary, #0066cc);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		margin-left: 1rem;
	}
</style>

