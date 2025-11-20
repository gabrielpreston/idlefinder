<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { adventurers, gameState } from '$lib/stores/gameState';
	import { getSlotEffectiveRate } from '$lib/domain/queries/FacilityEffectQueries';
	import type { ResourceSlot } from '$lib/domain/entities/ResourceSlot';

	export let slot: ResourceSlot;

	const dispatch = createEventDispatcher<{
		assign: { assigneeType: 'player' | 'adventurer'; assigneeId?: string };
		close: void;
	}>();

	$: idleAdventurers = $adventurers.filter(a => a.state === 'Idle');

	function getEffectiveRate(assigneeType: 'player' | 'adventurer'): number {
		if (!$gameState) return 0;
		
		// Use centralized query function
		return getSlotEffectiveRate(slot, assigneeType, $gameState);
	}

	function assignPlayer() {
		dispatch('assign', { assigneeType: 'player' });
	}

	function assignAdventurer(adventurerId: string) {
		dispatch('assign', { assigneeType: 'adventurer', assigneeId: adventurerId });
	}

	function close() {
		dispatch('close');
	}
</script>

<div 
	class="modal-overlay" 
	onclick={close}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			close();
		}
	}}
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
		<div class="modal-header">
			<h3 id="modal-title">Assign Worker to {slot.metadata.displayName || 'Slot'}</h3>
			<button class="close-btn" onclick={close} aria-label="Close modal">×</button>
		</div>
		
		<div class="modal-body">
			<div class="assignment-options">
				<button class="option-btn" onclick={assignPlayer}>
					<div class="option-label">Yourself (Guildmaster)</div>
					<div class="option-desc">{getEffectiveRate('player').toFixed(1)} {slot.attributes.resourceType}/min</div>
				</button>
				
				{#if idleAdventurers.length > 0}
					<div class="adventurers-list">
						<div class="list-label">Idle Adventurers:</div>
						{#each idleAdventurers as adventurer}
							<button
								class="option-btn"
								onclick={() => assignAdventurer(adventurer.id)}
							>
								<div class="option-label">
									{adventurer.metadata.displayName || adventurer.metadata.name || 'Unknown'}
								</div>
								<div class="option-desc">{getEffectiveRate('adventurer').toFixed(1)} {slot.attributes.resourceType}/min</div>
							</button>
						{/each}
					</div>
				{:else}
					<div class="no-adventurers">
						No idle adventurers available
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		padding: 0;
		max-width: 500px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, #ddd);
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--color-text-secondary, #666);
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		color: var(--color-text, #333);
	}

	.modal-body {
		padding: 1rem;
	}

	.assignment-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-btn {
		padding: 1rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 6px;
		background: white;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.2s, border-color 0.2s;
	}

	.option-btn:hover {
		background: var(--color-bg-secondary, #f5f5f5);
		border-color: var(--color-primary, #4a90e2);
	}

	.option-label {
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.option-desc {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}

	.adventurers-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.list-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.25rem;
	}

	.no-adventurers {
		padding: 1rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
	}
</style>

