<script lang="ts">
	import Modal from '../ui/Modal.svelte';
	import Tabs from '../ui/Tabs.svelte';
	import XPProgressBar from './XPProgressBar.svelte';
	import Badge from '../ui/Badge.svelte';
	import { getPathfinderClass, getPathfinderAncestry, type PathfinderClassKey, type PathfinderAncestryKey } from '$lib/domain/data/pathfinder';
	import { getAdventurerXPProgress, getAdventurerEffectiveStats } from '$lib/domain/queries/RosterQueries';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { gameState, items } from '$lib/stores/gameState';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { Item } from '$lib/domain/entities/Item';

	export let adventurer: Adventurer | null = null;
	export let open: boolean = false;
	export let onClose: () => void = () => {};

	let activeTab = 'overview';

	$: if (!adventurer) {
		activeTab = 'overview';
	}

	$: className = adventurer ? getPathfinderClass(adventurer.attributes.classKey as PathfinderClassKey)?.name || adventurer.attributes.classKey : '';
	$: ancestryName = adventurer ? getPathfinderAncestry(adventurer.attributes.ancestryKey as PathfinderAncestryKey)?.name || adventurer.attributes.ancestryKey : '';
	$: displayName = adventurer ? (adventurer.metadata.displayName || adventurer.metadata.name || `Adventurer ${String(adventurer.id.slice(0, 8))}`) : 'Adventurer Details';
	
	$: xpProgress = adventurer ? getAdventurerXPProgress(adventurer) : null;
	$: effectiveStats = adventurer && $gameState ? getAdventurerEffectiveStats(adventurer, $gameState) : null;
	
	$: equippedItems = adventurer && $items ? (() => {
		const equipment = adventurer.attributes.equipment;
		if (!equipment) return {};
		
		const result: Record<string, Item | null> = {};
		if (equipment.weaponId) result.weapon = $items.find(i => i.id === equipment.weaponId) || null;
		if (equipment.armorId) result.armor = $items.find(i => i.id === equipment.armorId) || null;
		if (equipment.offHandId) result.offHand = $items.find(i => i.id === equipment.offHandId) || null;
		if (equipment.accessoryId) result.accessory = $items.find(i => i.id === equipment.accessoryId) || null;
		return result;
	})() : {};

	$: availableItems = $items.filter(item => item.state === 'InArmory');

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'abilities', label: 'Abilities' },
		{ id: 'equipment', label: 'Equipment' },
		{ id: 'traits', label: 'Traits' },
		{ id: 'status', label: 'Status' }
	];

	async function handleEquipItem(itemId: string, slot: 'weapon' | 'armor' | 'offHand' | 'accessory') {
		if (!adventurer) return;
		await dispatchCommand('EquipItem', {
			itemId,
			adventurerId: adventurer.id,
			slot
		});
	}

	async function handleUnequipItem(itemId: string, slot: 'weapon' | 'armor' | 'offHand' | 'accessory') {
		if (!adventurer) return;
		await dispatchCommand('UnequipItem', {
			itemId,
			adventurerId: adventurer.id,
			slot
		});
	}

	function formatStatKey(key: string): string {
		return key.charAt(0).toUpperCase() + key.slice(1);
	}
</script>

{#if adventurer}
	<Modal 
		{open} 
		title={displayName}
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
						<span class="info-label">Class:</span>
						<span class="info-value">{className}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Ancestry:</span>
						<span class="info-value">{ancestryName}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Level:</span>
						<span class="info-value">{String(adventurer.attributes.level)}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Base HP:</span>
						<span class="info-value">{String(adventurer.attributes.baseHP)}</span>
					</div>
					<div class="info-row">
						<span class="info-label">State:</span>
						<Badge variant={adventurer.state === 'Idle' ? 'success' : adventurer.state === 'OnMission' ? 'primary' : 'default'}>
							{adventurer.state === 'Idle' ? 'Available' : adventurer.state === 'OnMission' ? 'On Mission' : adventurer.state}
						</Badge>
					</div>
				</div>
				
				{#if xpProgress}
					<div class="xp-section">
						<h4>Experience</h4>
						<XPProgressBar {adventurer} />
					</div>
				{/if}
			</div>

			{/if}

			{#if activeTab === 'abilities'}
			<div class="tab-content">
				<div class="abilities-grid">
					{#if effectiveStats}
						{@const statsMap = effectiveStats.toMap()}
						{#each Array.from(statsMap.entries()) as [key, value]}
							<div class="ability-item">
								<span class="ability-label">{formatStatKey(key)}</span>
								<span class="ability-value" class:positive={value > 0} class:negative={value < 0}>
									{value > 0 ? '+' : ''}{String(value)}
								</span>
							</div>
						{/each}
					{:else}
						<div class="no-stats">No stats available</div>
					{/if}
				</div>
			</div>

			{/if}

			{#if activeTab === 'equipment'}
			<div class="tab-content">
				<div class="equipment-slots">
					<div class="equipment-slot">
						<div class="slot-label">Weapon</div>
						{#if equippedItems.weapon}
							<div class="equipped-item">
								<span class="item-name">{equippedItems.weapon.metadata.displayName || `${equippedItems.weapon.attributes.rarity} ${equippedItems.weapon.attributes.itemType}`}</span>
								<button class="btn-unequip" onclick={() => handleUnequipItem(equippedItems.weapon!.id, 'weapon')}>
									Unequip
								</button>
							</div>
						{:else}
							<div class="empty-slot">
								<select 
									class="equip-select"
									onchange={(e) => {
										const itemId = (e.target as HTMLSelectElement).value;
										if (itemId) handleEquipItem(itemId, 'weapon');
									}}
								>
									<option value="">Select weapon...</option>
									{#each availableItems.filter(i => i.attributes.itemType === 'weapon') as item}
										<option value={item.id}>
											{item.metadata.displayName || `${item.attributes.rarity} ${item.attributes.itemType}`}
										</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<div class="equipment-slot">
						<div class="slot-label">Armor</div>
						{#if equippedItems.armor}
							<div class="equipped-item">
								<span class="item-name">{equippedItems.armor.metadata.displayName || `${equippedItems.armor.attributes.rarity} ${equippedItems.armor.attributes.itemType}`}</span>
								<button class="btn-unequip" onclick={() => handleUnequipItem(equippedItems.armor!.id, 'armor')}>
									Unequip
								</button>
							</div>
						{:else}
							<div class="empty-slot">
								<select 
									class="equip-select"
									onchange={(e) => {
										const itemId = (e.target as HTMLSelectElement).value;
										if (itemId) handleEquipItem(itemId, 'armor');
									}}
								>
									<option value="">Select armor...</option>
									{#each availableItems.filter(i => i.attributes.itemType === 'armor') as item}
										<option value={item.id}>
											{item.metadata.displayName || `${item.attributes.rarity} ${item.attributes.itemType}`}
										</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<div class="equipment-slot">
						<div class="slot-label">Off-Hand</div>
						{#if equippedItems.offHand}
							<div class="equipped-item">
								<span class="item-name">{equippedItems.offHand.metadata.displayName || `${equippedItems.offHand.attributes.rarity} ${equippedItems.offHand.attributes.itemType}`}</span>
								<button class="btn-unequip" onclick={() => handleUnequipItem(equippedItems.offHand!.id, 'offHand')}>
									Unequip
								</button>
							</div>
						{:else}
							<div class="empty-slot">
								<select 
									class="equip-select"
									onchange={(e) => {
										const itemId = (e.target as HTMLSelectElement).value;
										if (itemId) handleEquipItem(itemId, 'offHand');
									}}
								>
									<option value="">Select off-hand...</option>
									{#each availableItems.filter(i => i.attributes.itemType === 'offHand') as item}
										<option value={item.id}>
											{item.metadata.displayName || `${item.attributes.rarity} ${item.attributes.itemType}`}
										</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<div class="equipment-slot">
						<div class="slot-label">Accessory</div>
						{#if equippedItems.accessory}
							<div class="equipped-item">
								<span class="item-name">{equippedItems.accessory.metadata.displayName || `${equippedItems.accessory.attributes.rarity} ${equippedItems.accessory.attributes.itemType}`}</span>
								<button class="btn-unequip" onclick={() => handleUnequipItem(equippedItems.accessory!.id, 'accessory')}>
									Unequip
								</button>
							</div>
						{:else}
							<div class="empty-slot">
								<select 
									class="equip-select"
									onchange={(e) => {
										const itemId = (e.target as HTMLSelectElement).value;
										if (itemId) handleEquipItem(itemId, 'accessory');
									}}
								>
									<option value="">Select accessory...</option>
									{#each availableItems.filter(i => i.attributes.itemType === 'accessory') as item}
										<option value={item.id}>
											{item.metadata.displayName || `${item.attributes.rarity} ${item.attributes.itemType}`}
										</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>
				</div>
			</div>

			{/if}

			{#if activeTab === 'traits'}
			<div class="tab-content">
				<div class="traits-section">
					{#if adventurer.attributes.traitTags && adventurer.attributes.traitTags.length > 0}
						<div class="trait-group">
							<h4>Mechanical Traits</h4>
							<div class="traits-list">
								{#each adventurer.attributes.traitTags as trait}
									<Badge variant="default" size="small">{trait}</Badge>
								{/each}
							</div>
						</div>
					{/if}
					
					{#if adventurer.metadata.loreTags && adventurer.metadata.loreTags.length > 0}
						<div class="trait-group">
							<h4>Lore Tags</h4>
							<div class="traits-list">
								{#each adventurer.metadata.loreTags as tag}
									<Badge variant="default" size="small">{tag}</Badge>
								{/each}
							</div>
						</div>
					{/if}
					
					{#if (!adventurer.attributes.traitTags || adventurer.attributes.traitTags.length === 0) && 
					    (!adventurer.metadata.loreTags || adventurer.metadata.loreTags.length === 0)}
						<div class="no-traits">No traits assigned</div>
					{/if}
				</div>
			</div>
			{/if}

			{#if activeTab === 'status'}
			<div class="tab-content">
				<div class="status-section">
					<div class="status-item">
						<span class="status-label">Current State:</span>
						<Badge variant={adventurer.state === 'Idle' ? 'success' : adventurer.state === 'OnMission' ? 'primary' : 'default'}>
							{adventurer.state}
						</Badge>
					</div>
					
					{#if adventurer.attributes.assignedSlotId}
						<div class="status-item">
							<span class="status-label">Assigned Slot:</span>
							<span class="status-value">{adventurer.attributes.assignedSlotId}</span>
						</div>
					{/if}
					
					{#if adventurer.timers.fatigueUntil}
						<div class="status-item">
							<span class="status-label">Fatigue Until:</span>
							<span class="status-value">
								{new Date(adventurer.timers.fatigueUntil).toLocaleString()}
							</span>
						</div>
					{/if}
					
					{#if adventurer.timers.recoveryUntil}
						<div class="status-item">
							<span class="status-label">Recovery Until:</span>
							<span class="status-value">
								{new Date(adventurer.timers.recoveryUntil).toLocaleString()}
							</span>
						</div>
					{/if}
					
					{#if adventurer.metadata.currentMissionId}
						<div class="status-item">
							<span class="status-label">Current Mission:</span>
							<span class="status-value">{adventurer.metadata.currentMissionId}</span>
						</div>
					{/if}
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
		margin-bottom: 1.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border, #eee);
	}

	.info-label {
		font-weight: 500;
		color: var(--color-text-secondary, #666);
	}

	.info-value {
		color: var(--color-text-primary, #000);
	}

	.xp-section {
		margin-top: 1rem;
	}

	.xp-section h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.abilities-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.ability-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.ability-label {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.5rem;
	}

	.ability-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary, #000);
	}

	.ability-value.positive {
		color: var(--color-success, #4caf50);
	}

	.ability-value.negative {
		color: var(--color-danger, #f44336);
	}

	.no-stats {
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
		padding: 2rem;
	}

	.equipment-slots {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.equipment-slot {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.slot-label {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--color-text-primary, #000);
	}

	.equipped-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-name {
		font-weight: 500;
	}

	.btn-unequip {
		padding: 0.5rem 1rem;
		background: var(--color-danger, #f44336);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.btn-unequip:hover {
		background: var(--color-danger-dark, #d32f2f);
	}

	.empty-slot {
		padding: 0.5rem 0;
	}

	.equip-select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.traits-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.trait-group h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.traits-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.no-traits {
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
		padding: 2rem;
	}

	.status-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.status-label {
		font-weight: 500;
		color: var(--color-text-secondary, #666);
	}

	.status-value {
		color: var(--color-text-primary, #000);
		font-variant-numeric: tabular-nums;
	}
</style>

