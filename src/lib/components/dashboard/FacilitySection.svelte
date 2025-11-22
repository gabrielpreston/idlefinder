<script lang="ts">
	import StatCard from '../ui/StatCard.svelte';
	import { guildHallTier, facilityCounts, guildHallUpgradeCost } from '$lib/stores/gameState';

	$: counts = $facilityCounts;
	$: upgradeCost = $guildHallUpgradeCost;
</script>

<div class="facility-section">
	<h3>Facilities</h3>
	<div class="overview-grid">
		<StatCard label="Guild Hall Tier" value={$guildHallTier} numberType="integer" />
		
		{#each Object.entries(counts) as [facilityType, count]}
			<StatCard 
				label={facilityType.replace(/([A-Z])/g, ' $1').trim()} 
				value={count}
				numberType="integer"
			/>
		{/each}
	</div>
	
	{#if upgradeCost}
		<div class="upgrade-cost">
			<h4>Guild Hall Upgrade Cost</h4>
			<div class="cost-details">
				<div class="cost-item">
					<span class="cost-label">Gold:</span>
					<span class="cost-value">{String(upgradeCost.get('gold') ?? 0)}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.facility-section {
		margin-bottom: 2rem;
	}

	.facility-section h3 {
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.upgrade-cost {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.upgrade-cost h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-text-primary, #000);
	}

	.cost-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.cost-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}

	.cost-label {
		color: var(--color-text-secondary, #666);
	}

	.cost-value {
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}
</style>

