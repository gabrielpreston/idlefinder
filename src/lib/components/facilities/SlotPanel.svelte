<script lang="ts">
	import { onMount } from 'svelte';
	import { slots, adventurers, gameState } from '$lib/stores/gameState';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { useCommandError } from '$lib/composables/useCommandError';
	import { ErrorMessage } from '$lib/components/ui';
	import type { ResourceSlot } from '$lib/domain/entities/ResourceSlot';
	import { getSlotEffectiveRate } from '$lib/domain/queries/FacilityEffectQueries';
	import { getWorkerMultiplier } from '$lib/domain/systems/ResourceRateCalculator';
	import type { Facility } from '$lib/domain/entities/Facility';

	export let facility: Facility;

	// Get slots for this facility
	$: facilitySlots = $slots.filter(slot => slot.attributes.facilityId === facility.id);

	let showAssignmentModal = false;
	let selectedSlot: ResourceSlot | null = null;

	// Use composable for command error handling
	const { error, clearError, cleanup } = useCommandError(['AssignWorkerToSlot', 'UnassignWorkerFromSlot']);

	// Cleanup on component unmount
	onMount(() => {
		return cleanup;
	});

	function openAssignmentModal(slot: ResourceSlot) {
		selectedSlot = slot;
		showAssignmentModal = true;
	}

	function closeAssignmentModal() {
		showAssignmentModal = false;
		selectedSlot = null;
	}

	async function assignWorker(slotId: string, assigneeType: 'player' | 'adventurer', assigneeId?: string) {
		clearError();
		await dispatchCommand('AssignWorkerToSlot', {
			slotId,
			assigneeType,
			assigneeId
		});
		closeAssignmentModal();
	}

	async function unassignWorker(slotId: string) {
		clearError();
		await dispatchCommand('UnassignWorkerFromSlot', {
			slotId
		});
	}

	function getEffectiveRate(slot: ResourceSlot): number {
		if (!$gameState) return 0;
		
		// For durationModifier slots, return multiplier (1.0 for none, 1.0 for player, 1.5 for adventurer)
		if (slot.attributes.resourceType === 'durationModifier') {
			const assigneeType = slot.attributes.assigneeType;
			if (assigneeType === 'none') return 1.0;
			return getWorkerMultiplier(assigneeType as 'player' | 'adventurer');
		}
		
		// Use centralized query function for resource slots
		return getSlotEffectiveRate(slot, slot.attributes.assigneeType as 'player' | 'adventurer', $gameState);
	}

	function getAssigneeName(slot: ResourceSlot): string {
		if (slot.attributes.assigneeType === 'player') {
			return 'Yourself (Guildmaster)';
		} else if (slot.attributes.assigneeType === 'adventurer') {
			const assigneeId = slot.attributes.assigneeId;
			if (assigneeId && typeof assigneeId === 'string' && assigneeId.length > 0) {
				const adventurer = $adventurers.find(a => a.id === assigneeId);
				if (adventurer) {
					const displayName = adventurer.metadata.displayName;
					const name = adventurer.metadata.name;
					return (typeof displayName === 'string' ? displayName : null) 
						|| (typeof name === 'string' ? name : null) 
						|| 'Unknown Adventurer';
				}
			}
		}
		return 'None';
	}
</script>

<div class="slot-panel">
	<h3>Resource Generation Slots</h3>
	
	<ErrorMessage message={$error} />
	
	{#if facilitySlots.length === 0}
		<p class="no-slots">No slots available for this facility.</p>
	{:else}
		<div class="slots-list">
			{#each facilitySlots as slot}
				<div class="slot-card">
					<div class="slot-header">
						<span class="slot-name">{slot.metadata.displayName || `${slot.attributes.resourceType} Slot`}</span>
						<span class="slot-state">{slot.state}</span>
					</div>
					
					<div class="slot-info">
						<div class="slot-resource">
							<span class="resource-type">{slot.attributes.resourceType === 'durationModifier' ? 'Mission Generation Speed' : slot.attributes.resourceType}</span>
							{#if slot.attributes.resourceType === 'durationModifier'}
								<span class="generation-rate">{getEffectiveRate(slot).toFixed(1)}x speed</span>
							{:else}
								<span class="generation-rate">{getEffectiveRate(slot).toFixed(1)} {slot.attributes.resourceType}/min</span>
							{/if}
						</div>
						
						<div class="slot-assignee">
							<span class="label">Assigned:</span>
							<span class="value">{getAssigneeName(slot)}</span>
						</div>
					</div>
					
					<div class="slot-actions">
						{#if slot.attributes.assigneeType !== 'none'}
							<button
								class="btn-unassign"
								onclick={() => unassignWorker(slot.id)}
							>
								Unassign
							</button>
						{:else}
							<button
								class="btn-assign"
								onclick={() => openAssignmentModal(slot)}
							>
								Assign Worker
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showAssignmentModal && selectedSlot}
	{#await import('./SlotAssignmentModal.svelte') then { default: SlotAssignmentModal }}
		<SlotAssignmentModal
			slot={selectedSlot}
			on:assign={(e) => assignWorker(selectedSlot!.id, e.detail.assigneeType, e.detail.assigneeId)}
			on:close={closeAssignmentModal}
		/>
	{/await}
{/if}

<style>
	.slot-panel {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f9f9f9);
		border-radius: 8px;
	}

	.slot-panel h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
	}

	.no-slots {
		color: var(--color-text-secondary, #666);
		font-style: italic;
	}

	.slots-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slot-card {
		padding: 0.75rem;
		background: white;
		border-radius: 6px;
		border: 1px solid var(--color-border, #ddd);
	}

	.slot-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.slot-name {
		font-weight: 600;
	}

	.slot-state {
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
		text-transform: capitalize;
	}

	.slot-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.slot-resource {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.resource-type {
		text-transform: capitalize;
		font-weight: 500;
	}

	.generation-rate {
		color: var(--color-text-secondary, #666);
	}

	.slot-assignee {
		display: flex;
		gap: 0.5rem;
	}

	.label {
		color: var(--color-text-secondary, #666);
	}

	.value {
		font-weight: 500;
	}

	.slot-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-assign,
	.btn-unassign {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.btn-assign {
		background: var(--color-primary, #4a90e2);
		color: white;
	}

	.btn-assign:hover {
		background: var(--color-primary-hover, #357abd);
	}

	.btn-unassign {
		background: var(--color-secondary, #e2e2e2);
		color: var(--color-text, #333);
	}

	.btn-unassign:hover {
		background: var(--color-secondary-hover, #d0d0d0);
	}
</style>

