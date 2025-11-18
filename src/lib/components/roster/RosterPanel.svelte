<script lang="ts">
	import { adventurers } from '$lib/stores/gameState';
</script>

<div class="roster-panel">
	<h2>Adventurer Roster</h2>
	
	<div class="adventurer-grid">
		{#each $adventurers as adventurer}
			<div class="adventurer-card">
				<div class="adventurer-header">
					<h3>{adventurer.metadata.displayName || `Adventurer ${adventurer.id.slice(0, 8)}`}</h3>
					<span class="level-badge">Level {adventurer.attributes.level}</span>
				</div>
				<div class="adventurer-stats">
					<div>XP: {adventurer.attributes.xp}</div>
					<div>State: {adventurer.state}</div>
					<div>Role: {adventurer.attributes.roleKey}</div>
				</div>
				{#if adventurer.attributes.equipment}
					<div class="equipment-preview">
						<div>Weapon: {adventurer.attributes.equipment.weaponId ? 'Equipped' : 'None'}</div>
						<div>Armor: {adventurer.attributes.equipment.armorId ? 'Equipped' : 'None'}</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.roster-panel {
		padding: 1rem;
	}

	.roster-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.adventurer-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.adventurer-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.adventurer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.adventurer-header h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.level-badge {
		padding: 0.25rem 0.5rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.adventurer-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.75rem;
	}

	.equipment-preview {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #ddd);
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}
</style>

