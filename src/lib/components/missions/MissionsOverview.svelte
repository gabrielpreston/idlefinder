<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import ProgressBar from '../ui/ProgressBar.svelte';
	import { missionCapacity, missionStatistics, missionDoctrine, recentCompletions } from '$lib/stores/gameState';

	export let onViewState: (_state: 'Available' | 'InProgress' | 'Completed') => void = () => {};

	$: capacity = $missionCapacity;
	$: stats = $missionStatistics;
	$: doctrine = $missionDoctrine;
	$: recent = $recentCompletions.slice(0, 5); // Show last 5 completed missions
</script>

<div class="missions-overview">
	<h3>Missions Overview</h3>
	
	<div class="overview-grid">
		<div class="capacity-card">
			<div class="capacity-header">
				<span class="capacity-label">Mission Capacity</span>
				<span class="capacity-value">
					{capacity?.current ?? 0} / {capacity?.max ?? 0}
				</span>
			</div>
			{#if capacity}
				<ProgressBar 
					progress={capacity.utilization} 
					showPercentage={true}
					variant={capacity.utilization >= 0.9 ? 'warning' : capacity.utilization >= 0.7 ? 'default' : 'success'}
				/>
			{/if}
		</div>
		
		{#if stats}
			<div 
				class="stat-card-clickable"
				onclick={() => onViewState('InProgress')}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onViewState('InProgress');
					}
				}}
			>
				<StatCard 
					label="Active Missions" 
					value={stats.inProgress}
					numberType="integer"
				/>
			</div>
			
			<div 
				class="stat-card-clickable"
				onclick={() => onViewState('Available')}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onViewState('Available');
					}
				}}
			>
				<StatCard 
					label="Available" 
					value={stats.available}
					numberType="integer"
				/>
			</div>
			
			<div 
				class="stat-card-clickable"
				onclick={() => onViewState('Completed')}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onViewState('Completed');
					}
				}}
			>
				<StatCard 
					label="Completed" 
					value={stats.completed}
					numberType="integer"
				/>
			</div>
		{/if}
		
		{#if doctrine}
			<StatCard 
				label="Doctrine" 
				value={doctrine.attributes.focus}
				subtitle={`Risk: ${doctrine.attributes.riskTolerance}`}
			/>
		{/if}
	</div>
	
	{#if recent.length > 0}
		<div class="recent-activity">
			<h4>Recent Activity</h4>
			<div class="recent-missions">
				{#each recent as mission (mission.id)}
					{@const missionName = (mission.metadata.name as string) || `Mission ${mission.id.slice(0, 8)}`}
					{@const completedAt = mission.timers['completedAt'] ? new Date(mission.timers['completedAt']).toLocaleString() : 'Unknown'}
					<div 
						class="recent-mission-item" 
						onclick={() => onViewState('Completed')} 
						role="button" 
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onViewState('Completed');
							}
						}}
					>
						<span class="recent-mission-name">{missionName}</span>
						<span class="recent-mission-time">{completedAt}</span>
					</div>
				{/each}
			</div>
			{#if $recentCompletions.length > 5}
				<button class="btn-view-all" onclick={() => onViewState('Completed')}>
					View All Completed Missions →
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.missions-overview {
		margin-bottom: 2rem;
	}

	.missions-overview h3 {
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.capacity-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.capacity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.capacity-label {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.capacity-value {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}

	.stat-card-clickable {
		cursor: pointer;
		transition: transform 0.2s;
	}

	.stat-card-clickable:hover {
		transform: translateY(-2px);
	}

	.stat-card-clickable:focus {
		outline: 2px solid var(--color-primary, #0066cc);
		outline-offset: 2px;
	}

	.recent-activity {
		margin-top: 2rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.recent-activity h4 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: var(--color-text-primary, #000);
	}

	.recent-missions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.recent-mission-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.recent-mission-item:hover {
		background: var(--color-bg-primary, #fff);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.recent-mission-name {
		font-weight: 500;
		color: var(--color-text-primary, #000);
		font-size: 0.9rem;
	}

	.recent-mission-time {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}

	.btn-view-all {
		padding: 0.5rem 1rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
		width: 100%;
	}

	.btn-view-all:hover {
		background: var(--color-primary-dark, #0052a3);
	}
</style>

