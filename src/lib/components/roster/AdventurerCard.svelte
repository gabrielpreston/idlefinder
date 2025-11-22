<script lang="ts">
	import Card from '../ui/Card.svelte';
	import Badge from '../ui/Badge.svelte';
	import XPProgressBar from './XPProgressBar.svelte';
	import { getPathfinderClass, getPathfinderAncestry, type PathfinderClassKey, type PathfinderAncestryKey } from '$lib/domain/data/pathfinder';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';

	export let adventurer: Adventurer;
	export let expanded: boolean = false;
	export let onClick: () => void = () => {};

	$: className = getPathfinderClass(adventurer.attributes.classKey as PathfinderClassKey)?.name || adventurer.attributes.classKey;
	$: ancestryName = getPathfinderAncestry(adventurer.attributes.ancestryKey as PathfinderAncestryKey)?.name || adventurer.attributes.ancestryKey;
	$: displayName = adventurer.metadata.displayName || adventurer.metadata.name || `Adventurer ${String(adventurer.id.slice(0, 8))}`;
	
	$: stateVariant = 
		adventurer.state === 'Idle' ? 'success' : 
		adventurer.state === 'OnMission' ? 'primary' : 
		adventurer.state === 'Fatigued' ? 'warning' : 'default';
</script>

<div 
	class="adventurer-card"
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
		<h4 class="adventurer-name">{displayName}</h4>
		<Badge variant="primary" size="small">Level {String(adventurer.attributes.level)}</Badge>
	</div>
	
	<div class="card-body">
		<div class="adventurer-info">
			<div class="class-ancestry">{className} • {ancestryName}</div>
			<div class="role-badge">
				<Badge variant="default" size="small">
					{adventurer.attributes.roleKey.replace(/_/g, ' ')}
				</Badge>
			</div>
		</div>
		
		<div class="state-badge">
			<Badge variant={stateVariant} size="small">
				{adventurer.state === 'Idle' ? 'Available' : 
				 adventurer.state === 'OnMission' ? 'On Mission' : 
				 adventurer.state}
			</Badge>
		</div>
		
		<div class="xp-section">
			<XPProgressBar {adventurer} />
		</div>
		
		{#if expanded && adventurer.attributes.equipment}
			<div class="equipment-preview">
				<div class="equipment-label">Equipment:</div>
				<div class="equipment-slots">
					{#if adventurer.attributes.equipment.weaponId}
						<span class="equipment-icon" title="Weapon">⚔️</span>
					{/if}
					{#if adventurer.attributes.equipment.armorId}
						<span class="equipment-icon" title="Armor">🛡️</span>
					{/if}
					{#if adventurer.attributes.equipment.offHandId}
						<span class="equipment-icon" title="Off-hand">🛡️</span>
					{/if}
					{#if adventurer.attributes.equipment.accessoryId}
						<span class="equipment-icon" title="Accessory">💍</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</Card>
</div>

<style>
	:global(.adventurer-card) {
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	:global(.adventurer-card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.adventurer-name {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text-primary, #000);
	}

	.adventurer-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.class-ancestry {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.role-badge {
		margin-left: 0.5rem;
	}

	.state-badge {
		margin-bottom: 0.75rem;
	}

	.xp-section {
		margin-bottom: 0.75rem;
	}

	.equipment-preview {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #ddd);
		margin-top: 0.75rem;
	}

	.equipment-label {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.25rem;
	}

	.equipment-slots {
		display: flex;
		gap: 0.5rem;
	}

	.equipment-icon {
		font-size: 1.2rem;
	}
</style>

