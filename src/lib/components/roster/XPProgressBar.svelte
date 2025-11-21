<script lang="ts">
	import ProgressBar from '../ui/ProgressBar.svelte';
	import { getAdventurerXPProgress } from '$lib/domain/queries/RosterQueries';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';

	export let adventurer: Adventurer;

	$: xpProgress = getAdventurerXPProgress(adventurer);
</script>

<div class="xp-progress">
	<ProgressBar 
		progress={xpProgress.progress} 
		label="XP Progress"
		showPercentage={false}
		variant={xpProgress.progress >= 0.9 ? 'success' : 'default'}
	/>
	<div class="xp-info">
		<span class="xp-current">{xpProgress.current} / {xpProgress.threshold} XP</span>
		{#if xpProgress.remaining > 0}
			<span class="xp-remaining">{xpProgress.remaining} to next level</span>
		{:else}
			<span class="xp-ready">Ready to level up!</span>
		{/if}
	</div>
</div>

<style>
	.xp-progress {
		width: 100%;
	}

	.xp-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}

	.xp-current {
		font-variant-numeric: tabular-nums;
	}

	.xp-remaining {
		font-variant-numeric: tabular-nums;
	}

	.xp-ready {
		color: var(--color-success, #4caf50);
		font-weight: 600;
	}
</style>

