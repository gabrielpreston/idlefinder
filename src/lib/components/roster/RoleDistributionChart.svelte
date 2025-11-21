<script lang="ts">
	import { rosterRoleDistribution } from '$lib/stores/gameState';
	import { adventurers } from '$lib/stores/gameState';

	$: totalAdventurers = $adventurers.length;
	$: distribution = $rosterRoleDistribution;
	
	$: distributionWithPercentages = (() => {
		if (totalAdventurers === 0) return [];
		
		return Object.entries(distribution).map(([roleKey, count]) => ({
			roleKey,
			count,
			percentage: (count / totalAdventurers) * 100
		})).sort((a, b) => b.count - a.count);
	})();
</script>

<div class="role-distribution">
	<h4>Role Distribution</h4>
	{#if totalAdventurers === 0}
		<div class="empty-state">No adventurers yet</div>
	{:else}
		<div class="distribution-list">
			{#each distributionWithPercentages as item}
				<div class="distribution-item">
					<div class="role-info">
						<span class="role-key">{item.roleKey.replace(/_/g, ' ')}</span>
						<span class="role-count">{item.count}</span>
					</div>
					<div class="role-bar">
						<div 
							class="role-bar-fill" 
							style="width: {item.percentage}%"
						></div>
					</div>
					<div class="role-percentage">{item.percentage.toFixed(1)}%</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.role-distribution {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.role-distribution h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
		padding: 1rem;
	}

	.distribution-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.distribution-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.role-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.role-key {
		text-transform: capitalize;
		color: var(--color-text-primary, #000);
	}

	.role-count {
		font-weight: 600;
		color: var(--color-text-secondary, #666);
	}

	.role-bar {
		width: 100%;
		height: 8px;
		background: var(--color-border, #e0e0e0);
		border-radius: 4px;
		overflow: hidden;
	}

	.role-bar-fill {
		height: 100%;
		background: var(--color-primary, #0066cc);
		transition: width 0.3s ease;
	}

	.role-percentage {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>

