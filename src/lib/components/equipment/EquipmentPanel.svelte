<script lang="ts">
	import { items, autoEquipRules } from '$lib/stores/gameState';
	import { derived } from 'svelte/store';
	
	let activeTab = 'armory';

	const armoryItems = derived(items, ($items) => $items.filter(item => item.state === 'InArmory'));
</script>

<div class="equipment-panel">
	<h2>Equipment</h2>
	
	<div class="tabs">
		<button class:active={activeTab === 'armory'} onclick={() => activeTab = 'armory'}>Armory</button>
		<button class:active={activeTab === 'rules'} onclick={() => activeTab = 'rules'}>Auto-Equip Rules</button>
	</div>

	{#if activeTab === 'armory'}
		<div class="armory-view">
			<h3>Armory ({$armoryItems.length} items)</h3>
			<div class="item-grid">
				{#each $armoryItems as item}
					<div class="item-card">
						<div class="item-header">
							<span class="item-name">{item.metadata.displayName || `${item.attributes.rarity} ${item.attributes.itemType}`}</span>
							<span class="rarity-badge">{item.attributes.rarity}</span>
						</div>
						<div class="item-stats">
							<div>Type: {item.attributes.itemType}</div>
							<div>Durability: {item.attributes.durability}/{item.attributes.maxDurability}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="rules-view">
			{#if $autoEquipRules}
				<div class="rule-section">
					<div class="rule-item">
						<span class="rule-label">Focus:</span>
						<span class="rule-value">{$autoEquipRules.attributes.focus}</span>
					</div>
				</div>
				<div class="rule-section">
					<div class="rule-item">
						<span class="rule-label">Allow Rare Auto-Equip:</span>
						<span class="rule-value">{$autoEquipRules.attributes.allowRareAutoEquip ? 'Yes' : 'No'}</span>
					</div>
				</div>
			{:else}
				<p>No auto-equip rules configured.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.equipment-panel {
		padding: 1rem;
	}

	.equipment-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border, #ddd);
	}

	.tabs button {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-bottom: 2px solid transparent;
	}

	.tabs button.active {
		border-bottom-color: var(--color-primary, #0066cc);
		font-weight: 600;
	}

	.item-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.item-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.item-name {
		font-weight: 600;
	}

	.rarity-badge {
		padding: 0.25rem 0.5rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.item-stats {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.rule-section {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.rule-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.rule-label {
		font-weight: 500;
	}

	.rule-value {
		color: var(--color-text-secondary, #666);
	}
</style>

