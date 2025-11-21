<script lang="ts">
	import Card from '../ui/Card.svelte';
	import Badge from '../ui/Badge.svelte';
	import { getPathfinderClass, getPathfinderAncestry } from '$lib/domain/data/pathfinder';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import { recruitAdventurerCost } from '$lib/stores/gameState';

	export let adventurer: Adventurer;
	export let onClick: () => void = () => {};

	$: className = getPathfinderClass(adventurer.attributes.classKey as any)?.name || adventurer.attributes.classKey;
	$: ancestryName = getPathfinderAncestry(adventurer.attributes.ancestryKey as any)?.name || adventurer.attributes.ancestryKey;
	$: cost = $recruitAdventurerCost?.get('gold') ?? 50;
</script>

<div 
	class="recruit-preview-card"
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
	variant="default"
	padding="medium"
>
	<div slot="header" class="card-header">
		<h4 class="preview-label">Preview</h4>
		<Badge variant="primary" size="small">Level {adventurer.attributes.level}</Badge>
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
		
		<div class="cost-section">
			<Badge variant="warning" size="small">
				{cost} gold to recruit
			</Badge>
		</div>
	</div>
</Card>
</div>

<style>
	:global(.recruit-preview-card) {
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	:global(.recruit-preview-card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.preview-label {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text-secondary, #666);
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

	.cost-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #ddd);
	}
</style>

