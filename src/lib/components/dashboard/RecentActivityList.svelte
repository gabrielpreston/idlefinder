<script lang="ts">
	import type { Mission } from '$lib/domain/entities/Mission';

	export let missions: Mission[] = [];
	export let onViewAll: () => void = () => {};
	export let onItemClick: () => void = () => {};
	export let maxItems: number = 5;
</script>

{#if missions.length > 0}
	<div class="recent-activity">
		<h4>Recent Activity</h4>
		<div class="recent-missions">
			{#each missions.slice(0, maxItems) as mission (mission.id)}
				{@const missionName = (mission.metadata.name as string) || `Mission ${mission.id.slice(0, 8)}`}
				{@const completedAt = mission.timers['completedAt'] ? new Date(mission.timers['completedAt']).toLocaleString() : 'Unknown'}
				<div 
					class="recent-mission-item" 
					onclick={onItemClick} 
					role="button" 
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onItemClick();
						}
					}}
				>
					<span class="recent-mission-name">{missionName}</span>
					<span class="recent-mission-time">{completedAt}</span>
				</div>
			{/each}
		</div>
		{#if missions.length > maxItems}
			<button class="btn-view-all" onclick={onViewAll}>
				View All →
			</button>
		{/if}
	</div>
{/if}

<style>
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

