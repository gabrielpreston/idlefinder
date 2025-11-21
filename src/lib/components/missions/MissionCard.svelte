<script lang="ts">
	import Card from '../ui/Card.svelte';
	import Badge from '../ui/Badge.svelte';
	import DurationProgress from '../ui/DurationProgress.svelte';
	import type { Mission } from '$lib/domain/entities/Mission';

	export let mission: Mission;
	export let expanded: boolean = false;
	export let onClick: () => void = () => {};

	$: missionName = (mission.metadata.name as string) || `Mission ${mission.id.slice(0, 8)}`;
	$: stateVariant = mission.state === 'Available' ? 'success' : 
	                  mission.state === 'InProgress' ? 'primary' : 
	                  mission.state === 'Completed' ? 'default' : 'warning';
	
	$: startedAtMs = mission.timers['startedAt'];
	$: endsAtMs = mission.timers['endsAt'];
	$: duration = startedAtMs && endsAtMs ? endsAtMs - startedAtMs : mission.attributes.baseDuration.toMilliseconds();
	$: showProgress = mission.state === 'InProgress' && startedAtMs && endsAtMs && duration > 0;
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
	<div slot="header" class="card-header">
		<h4 class="mission-name">{missionName}</h4>
		<Badge variant={stateVariant} size="small">
			{mission.state === 'Available' ? 'Available' : 
			 mission.state === 'InProgress' ? 'In Progress' : 
			 mission.state}
		</Badge>
	</div>
	
	<div class="card-body">
		<div class="mission-info">
			<div class="mission-type-difficulty">
				<Badge variant="default" size="small">
					{mission.attributes.missionType}
				</Badge>
				<span class="difficulty">DC {mission.attributes.dc}</span>
			</div>
		</div>
		
		<div class="mission-details">
			<div class="detail-item">
				<span class="detail-label">Duration:</span>
				<span class="detail-value">{Math.floor(duration / 1000)}s</span>
			</div>
			<div class="detail-item">
				<span class="detail-label">Rewards:</span>
				<span class="detail-value">
					{mission.attributes.baseRewards.gold}g, {mission.attributes.baseRewards.xp} XP
					{#if mission.attributes.baseRewards.fame}
						, {mission.attributes.baseRewards.fame} Fame
					{/if}
				</span>
			</div>
		</div>
		
		{#if showProgress}
			<div class="progress-section">
				<DurationProgress
					startTime={startedAtMs}
					duration={duration}
					label={missionName}
				/>
			</div>
		{/if}
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

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.mission-name {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}

	.mission-info {
		margin-bottom: 0.75rem;
	}

	.mission-type-difficulty {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.difficulty {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.mission-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
	}

	.detail-label {
		color: var(--color-text-secondary, #666);
	}

	.detail-value {
		color: var(--color-text-primary, #000);
		font-weight: 500;
	}

	.progress-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #ddd);
	}
</style>

