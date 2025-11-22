<script lang="ts">
	import Modal from '../ui/Modal.svelte';
	import Tabs from '../ui/Tabs.svelte';
	import Badge from '../ui/Badge.svelte';
	import DurationProgress from '../ui/DurationProgress.svelte';
	import { getAssignedAdventurersForMission, getMissionDisplayDuration } from '$lib/domain/queries/MissionStatisticsQueries';
	import { gameState } from '$lib/stores/gameState';
	import { getTimer } from '$lib/domain/primitives/TimerHelpers';
	import type { Mission } from '$lib/domain/entities/Mission';

	export let mission: Mission | null = null;
	export let open: boolean = false;
	export let onClose: () => void = () => {};

	let activeTab = 'overview';

	$: if (!mission) {
		activeTab = 'overview';
	}

	$: missionName = mission ? ((mission.metadata.name as string) || `Mission ${String(mission.id.slice(0, 8))}`) : '';
	$: stateVariant = mission?.state === 'Available' ? 'success' : 
	                  mission?.state === 'InProgress' ? 'primary' : 
	                  mission?.state === 'Completed' ? 'default' : 'warning';
	
	// Use unified query function for duration
	$: duration = mission ? getMissionDisplayDuration(mission) : 0;
	
	// Get timers for progress display (using TimerHelpers for consistency)
	$: startedAtTimer = mission ? getTimer(mission, 'startedAt') : null;
	$: endsAtTimer = mission ? getTimer(mission, 'endsAt') : null;
	$: startedAtMs = startedAtTimer?.value;
	$: endsAtMs = endsAtTimer?.value;
	$: showProgress = mission?.state === 'InProgress' && startedAtMs && endsAtMs && duration > 0;
	
	$: assignedAdventurerDetails = mission && $gameState 
		? getAssignedAdventurersForMission($gameState, mission.id)
		: [];

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'adventurers', label: 'Adventurers' },
		{ id: 'rewards', label: 'Rewards' },
		{ id: 'progress', label: 'Progress' },
		{ id: 'history', label: 'History' }
	];
</script>

{#if mission}
	<Modal 
		{open} 
		title={missionName}
		on:close={onClose}
	>
		<Tabs 
			{tabs} 
			{activeTab} 
			onTabChange={(tabId) => activeTab = tabId}
		>
			{#if activeTab === 'overview'}
			<div class="tab-content">
				<div class="overview-section">
					<div class="info-row">
						<span class="info-label">Type:</span>
						<span class="info-value">{mission.attributes.missionType}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Difficulty:</span>
						<span class="info-value">{String(mission.attributes.difficultyTier)} (DC {String(mission.attributes.dc)})</span>
					</div>
					<div class="info-row">
						<span class="info-label">Primary Ability:</span>
						<span class="info-value">{mission.attributes.primaryAbility.toUpperCase()}</span>
					</div>
					{#if mission.attributes.preferredRole}
						<div class="info-row">
							<span class="info-label">Preferred Role:</span>
							<span class="info-value">{mission.attributes.preferredRole.replace(/_/g, ' ')}</span>
						</div>
					{/if}
					<div class="info-row">
						<span class="info-label">Max Party Size:</span>
						<span class="info-value">{mission.attributes.maxPartySize}</span>
					</div>
					<div class="info-row">
						<span class="info-label">State:</span>
						<Badge variant={stateVariant} size="small">
							{mission.state === 'Available' ? 'Available' : 
							 mission.state === 'InProgress' ? 'In Progress' : 
							 mission.state}
						</Badge>
					</div>
					<div class="info-row">
						<span class="info-label">Base Duration:</span>
						<span class="info-value">{Math.floor(mission.attributes.baseDuration.toMilliseconds() / 1000)}s</span>
					</div>
				</div>
			</div>
			{/if}

			{#if activeTab === 'adventurers'}
			<div class="tab-content">
				{#if assignedAdventurerDetails.length === 0}
					<div class="empty-state">
						<p>No adventurers assigned to this mission.</p>
					</div>
				{:else}
					<div class="adventurers-list">
						{#each assignedAdventurerDetails as adventurer}
							<div class="adventurer-item">
								<div class="adventurer-name">
									{adventurer.metadata.displayName || adventurer.metadata.name || `Adventurer ${String(adventurer.id.slice(0, 8))}`}
								</div>
								<div class="adventurer-details">
									Level {String(adventurer.attributes.level)} • {adventurer.attributes.roleKey.replace(/_/g, ' ')}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			{/if}

			{#if activeTab === 'rewards'}
			<div class="tab-content">
				<div class="rewards-section">
					<h4>Base Rewards</h4>
					<div class="rewards-grid">
						<div class="reward-item">
							<span class="reward-label">Gold:</span>
							<span class="reward-value">{String(mission.attributes.baseRewards.gold)}</span>
						</div>
						<div class="reward-item">
							<span class="reward-label">XP:</span>
							<span class="reward-value">{String(mission.attributes.baseRewards.xp)}</span>
						</div>
						{#if mission.attributes.baseRewards.fame}
							<div class="reward-item">
								<span class="reward-label">Fame:</span>
								<span class="reward-value">{String(mission.attributes.baseRewards.fame)}</span>
							</div>
						{/if}
						{#if mission.attributes.baseRewards.materials}
							<div class="reward-item">
								<span class="reward-label">Materials:</span>
								<span class="reward-value">{String(mission.attributes.baseRewards.materials)}</span>
							</div>
						{/if}
					</div>
					
					<div class="outcome-multipliers">
						<h4>Outcome Multipliers</h4>
						<div class="multiplier-list">
							<div class="multiplier-item">
								<span class="multiplier-label">Critical Success:</span>
								<span class="multiplier-value">150%</span>
							</div>
							<div class="multiplier-item">
								<span class="multiplier-label">Success:</span>
								<span class="multiplier-value">100%</span>
							</div>
							<div class="multiplier-item">
								<span class="multiplier-label">Failure:</span>
								<span class="multiplier-value">50%</span>
							</div>
							<div class="multiplier-item">
								<span class="multiplier-label">Critical Failure:</span>
								<span class="multiplier-value">0%</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/if}

			{#if activeTab === 'progress'}
			<div class="tab-content">
				{#if showProgress}
					<div class="progress-section">
						<DurationProgress
							startTime={startedAtMs}
							duration={duration}
							label={missionName}
						/>
					</div>
				{:else}
					<div class="empty-state">
						<p>This mission is not in progress.</p>
					</div>
				{/if}
			</div>
			{/if}

			{#if activeTab === 'history'}
			<div class="tab-content">
				<div class="history-section">
					<div class="timeline">
						{#if mission.timers['startedAt']}
							<div class="timeline-item">
								<div class="timeline-marker started"></div>
								<div class="timeline-content">
									<div class="timeline-label">Mission Started</div>
									<div class="timeline-time">
										{new Date(mission.timers['startedAt']).toLocaleString()}
									</div>
								</div>
							</div>
						{/if}
						
						{#if mission.state === 'InProgress' && mission.timers['endsAt']}
							<div class="timeline-item">
								<div class="timeline-marker in-progress"></div>
								<div class="timeline-content">
									<div class="timeline-label">In Progress</div>
									<div class="timeline-time">
										Expected completion: {new Date(mission.timers['endsAt']).toLocaleString()}
									</div>
								</div>
							</div>
						{/if}
						
						{#if mission.timers['completedAt']}
							<div class="timeline-item">
								<div class="timeline-marker completed"></div>
								<div class="timeline-content">
									<div class="timeline-label">Mission Completed</div>
									<div class="timeline-time">
										{new Date(mission.timers['completedAt']).toLocaleString()}
									</div>
									{#if startedAtMs && mission.timers['completedAt']}
										{@const completedDuration = mission.timers['completedAt'] - startedAtMs}
										<div class="timeline-duration">
											Duration: {Math.floor(completedDuration / 1000)}s
										</div>
									{/if}
								</div>
							</div>
						{:else if mission.state === 'Available'}
							<div class="timeline-item">
								<div class="timeline-marker available"></div>
								<div class="timeline-content">
									<div class="timeline-label">Available</div>
									<div class="timeline-time">Not yet started</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			{/if}
		</Tabs>
	</Modal>
{/if}

<style>
	.tab-content {
		padding: 0.5rem 0;
	}

	.overview-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border, #eee);
	}

	.info-label {
		font-weight: 600;
		color: var(--color-text-secondary, #666);
	}

	.info-value {
		color: var(--color-text-primary, #000);
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
	}

	.adventurers-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.adventurer-item {
		padding: 0.75rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 4px;
		border: 1px solid var(--color-border, #ddd);
	}

	.adventurer-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.adventurer-details {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.rewards-section h4 {
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.rewards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.reward-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 4px;
	}

	.reward-label {
		color: var(--color-text-secondary, #666);
	}

	.reward-value {
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}

	.outcome-multipliers {
		margin-top: 1.5rem;
	}

	.outcome-multipliers h4 {
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.multiplier-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.multiplier-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 4px;
	}

	.multiplier-label {
		color: var(--color-text-secondary, #666);
	}

	.multiplier-value {
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}

	.progress-section {
		padding: 1rem 0;
	}

	.history-section {
		padding: 0.5rem 0;
	}

	.timeline {
		position: relative;
		padding-left: 2rem;
	}

	.timeline-item {
		position: relative;
		padding-bottom: 1.5rem;
	}

	.timeline-item:not(:last-child)::before {
		content: '';
		position: absolute;
		left: -1.75rem;
		top: 1.5rem;
		bottom: -0.5rem;
		width: 2px;
		background: var(--color-border, #ddd);
	}

	.timeline-marker {
		position: absolute;
		left: -2rem;
		top: 0.25rem;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 2px solid var(--color-border, #ddd);
		background: white;
	}

	.timeline-marker.started {
		background: var(--color-primary, #0066cc);
		border-color: var(--color-primary, #0066cc);
	}

	.timeline-marker.in-progress {
		background: var(--color-primary, #0066cc);
		border-color: var(--color-primary, #0066cc);
		animation: pulse 2s infinite;
	}

	.timeline-marker.completed {
		background: var(--color-success, #28a745);
		border-color: var(--color-success, #28a745);
	}

	.timeline-marker.available {
		background: var(--color-text-secondary, #999);
		border-color: var(--color-text-secondary, #999);
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.timeline-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.timeline-label {
		font-weight: 600;
		color: var(--color-text-primary, #000);
		font-size: 0.95rem;
	}

	.timeline-time {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}

	.timeline-duration {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
		font-style: italic;
	}

	/* Responsive: Better mobile layout */
	@media (max-width: 768px) {
		.timeline {
			padding-left: 1.5rem;
		}

		.timeline-marker {
			left: -1.75rem;
			width: 0.75rem;
			height: 0.75rem;
		}

		.timeline-item:not(:last-child)::before {
			left: -1.5rem;
		}

		.rewards-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

