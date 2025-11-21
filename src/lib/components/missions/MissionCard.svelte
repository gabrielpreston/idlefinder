<script lang="ts">
	import Card from '../ui/Card.svelte';
	import Badge from '../ui/Badge.svelte';
	import DurationProgress from '../ui/DurationProgress.svelte';
	import { getAssignedAdventurersForMission, getMissionDisplayDuration } from '$lib/domain/queries/MissionStatisticsQueries';
	import { gameState } from '$lib/stores/gameState';
	import { getTimer } from '$lib/domain/primitives/TimerHelpers';
	import type { Mission } from '$lib/domain/entities/Mission';

	export let mission: Mission;
	export let expanded: boolean = false;
	export let onClick: () => void = () => {};

	$: missionName = (mission.metadata.name as string) || `Mission ${mission.id.slice(0, 8)}`;
	$: stateVariant = mission.state === 'Available' ? 'success' : 
	                  mission.state === 'InProgress' ? 'primary' : 
	                  mission.state === 'Completed' ? 'default' : 'warning';
	
	// Use unified query function for duration
	$: duration = getMissionDisplayDuration(mission);
	
	// Get timers for progress display (using TimerHelpers for consistency)
	$: startedAtTimer = getTimer(mission, 'startedAt');
	$: endsAtTimer = getTimer(mission, 'endsAt');
	$: startedAtMs = startedAtTimer?.value;
	$: endsAtMs = endsAtTimer?.value;
	$: showProgress = mission.state === 'InProgress' && startedAtMs && endsAtMs && duration > 0;
	
	$: assignedAdventurers = mission.state === 'InProgress' && $gameState
		? getAssignedAdventurersForMission($gameState, mission.id)
		: [];
	
	$: completedAtMs = mission.timers['completedAt'];
	$: completedAt = completedAtMs ? new Date(completedAtMs).toLocaleString() : null;
</script>

<div 
	class="mission-card"
	onclick={onClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick();
		}
	}}
>
<Card 
	variant={expanded ? 'highlight' : 'default'}
	padding="medium"
>
	<div class="mission-card-horizontal">
		<div class="mission-main">
			<div class="mission-header-row">
				<h4 class="mission-name">{missionName}</h4>
				<Badge variant={stateVariant} size="small">
					{mission.state === 'Available' ? 'Available' : 
					 mission.state === 'InProgress' ? 'In Progress' : 
					 mission.state}
				</Badge>
			</div>
			
			<div class="mission-meta-row">
				<Badge variant="default" size="small">
					{mission.attributes.missionType}
				</Badge>
				<span class="difficulty">DC {mission.attributes.dc}</span>
				<span class="separator">•</span>
				<span class="duration">{Math.floor(duration / 1000)}s</span>
			</div>
		</div>
		
		<div class="mission-details-horizontal">
			{#if mission.state === 'Available'}
				<!-- Available: Emphasize rewards and difficulty -->
				<div class="rewards-section">
					<div class="reward-item">
						<span class="reward-icon">💰</span>
						<span class="reward-value">{mission.attributes.baseRewards.gold}g</span>
					</div>
					<div class="reward-item">
						<span class="reward-icon">⭐</span>
						<span class="reward-value">{mission.attributes.baseRewards.xp} XP</span>
					</div>
					{#if mission.attributes.baseRewards.fame}
						<div class="reward-item">
							<span class="reward-icon">🏆</span>
							<span class="reward-value">{mission.attributes.baseRewards.fame}</span>
						</div>
					{/if}
				</div>
			{:else if mission.state === 'InProgress'}
				<!-- InProgress: Emphasize progress and time remaining -->
				<div class="progress-section-horizontal">
					{#if showProgress}
						<DurationProgress
							startTime={startedAtMs}
							duration={duration}
							label=""
						/>
					{/if}
					{#if assignedAdventurers.length > 0}
						<div class="assigned-adventurers">
							<span class="adventurer-label">Assigned:</span>
							{#each assignedAdventurers as adventurer}
								<span class="adventurer-name-small">
									{adventurer.metadata.displayName || adventurer.metadata.name || `Adventurer ${adventurer.id.slice(0, 8)}`}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{:else if mission.state === 'Completed'}
				<!-- Completed: Emphasize completion time and rewards -->
				<div class="completion-section">
					{#if completedAt}
						<div class="completion-time">
							<span class="completion-label">Completed:</span>
							<span class="completion-value">{completedAt}</span>
						</div>
					{/if}
					<div class="rewards-section">
						<span class="reward-value">{mission.attributes.baseRewards.gold}g</span>
						<span class="reward-value">{mission.attributes.baseRewards.xp} XP</span>
						{#if mission.attributes.baseRewards.fame}
							<span class="reward-value">{mission.attributes.baseRewards.fame} Fame</span>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</Card>
</div>

<style>
	:global(.mission-card) {
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	:global(.mission-card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.mission-card-horizontal {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
	}

	.mission-main {
		flex: 1;
		min-width: 0;
	}

	.mission-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		gap: 0.75rem;
	}

	.mission-name {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary, #000);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mission-meta-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.difficulty {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		font-weight: 500;
	}

	.duration {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.separator {
		color: var(--color-text-secondary, #ccc);
		font-size: 0.9rem;
	}

	.mission-details-horizontal {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		min-width: fit-content;
	}

	.rewards-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.reward-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.reward-icon {
		font-size: 1rem;
	}

	.reward-value {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text-primary, #000);
		white-space: nowrap;
	}

	.progress-section-horizontal {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		min-width: 200px;
	}

	.assigned-adventurers {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		font-size: 0.85rem;
	}

	.adventurer-label {
		color: var(--color-text-secondary, #666);
		font-size: 0.85rem;
	}

	.adventurer-name-small {
		color: var(--color-text-primary, #000);
		font-weight: 500;
	}

	.completion-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.completion-time {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.completion-label {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}

	.completion-value {
		font-size: 0.9rem;
		color: var(--color-text-primary, #000);
		font-weight: 500;
	}

	/* Responsive: Stack vertically on mobile */
	@media (max-width: 768px) {
		.mission-card-horizontal {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.mission-details-horizontal {
			align-items: flex-start;
			width: 100%;
		}

		.progress-section-horizontal {
			width: 100%;
			min-width: unset;
		}
	}
</style>

