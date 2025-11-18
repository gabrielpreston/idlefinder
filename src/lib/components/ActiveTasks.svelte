<script lang="ts">
	import { missions } from '$lib/stores/gameState';
	import { DurationProgress } from './ui';
	// Note: Store updates automatically via gameState subscription, no need for direct bus access
</script>

<div class="active-tasks">
	<h2>Active Missions</h2>

	{#if $missions.filter(m => m.state === 'InProgress').length === 0}
		<div>No active missions</div>
	{:else}
		{#each $missions.filter(m => m.state === 'InProgress') as mission}
			{@const startedAtMs = mission.timers['startedAt']}
			{@const endsAtMs = mission.timers['endsAt']}
			{@const missionName = (mission.metadata.name as string) || `Mission ${mission.id}`}
			{@const duration = startedAtMs && endsAtMs ? endsAtMs - startedAtMs : mission.attributes.baseDuration.toMilliseconds()}
			<div class="mission-item">
				<div class="mission-name">{missionName}</div>
				<div class="mission-details">
					Duration: {Math.floor(duration / 1000)}s
				</div>
				{#if startedAtMs && endsAtMs && duration > 0 && !isNaN(duration) && !isNaN(startedAtMs)}
					<div class="mission-progress">
						<DurationProgress
							startTime={startedAtMs}
							duration={duration}
							label={missionName}
						/>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
	.active-tasks {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.mission-item {
		padding: 0.5rem;
		margin: 0.5rem 0;
		background: #f9f9f9;
		border-radius: 4px;
	}

	.mission-name {
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.mission-details {
		font-size: 0.9em;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.mission-progress {
		margin-top: 0.5rem;
	}
</style>
