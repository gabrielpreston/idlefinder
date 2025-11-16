<script lang="ts">
	import { missions } from '$lib/stores/gameState';
	import { getBusManager } from '$lib/bus/BusManager';
	import { DurationProgress } from './ui';

	// Subscribe to mission completion events to refresh
	const busManager = getBusManager();
	busManager.domainEventBus.subscribe('MissionCompleted', () => {
		// Store will update automatically via gameState subscription
	});
</script>

<div class="active-tasks">
	<h2>Active Missions</h2>

	{#if $missions.filter(m => m.status === 'inProgress').length === 0}
		<div>No active missions</div>
	{:else}
		{#each $missions.filter(m => m.status === 'inProgress') as mission}
			<div class="mission-item">
				<div class="mission-name">{mission.name}</div>
				<div class="mission-details">
					Adventurers: {mission.assignedAdventurerIds.length} | Duration:{' '}
					{Math.floor(mission.duration / 1000)}s
				</div>
				<div class="mission-progress">
					<DurationProgress
						startTime={mission.startTime}
						duration={mission.duration}
						label={mission.name}
					/>
				</div>
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
