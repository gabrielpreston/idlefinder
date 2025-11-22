<script lang="ts">
	import { onMount } from 'svelte';
	import { facilities, guildHallUpgradeCost, canUpgradeGuildHallState, guildHall, missionSlotCapacity, availableFacilities, gameState } from '$lib/stores/gameState';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { useCommandError } from '$lib/composables/useCommandError';
	import { ErrorMessage } from '$lib/components/ui';
	import SlotPanel from './SlotPanel.svelte';
	import { getFacilityConstructionCost, canAffordFacilityConstruction } from '$lib/domain/queries/CostQueries';

	// Use composable for command error handling
	const { error, clearError, cleanup } = useCommandError(['UpgradeFacility', 'ConstructFacility']);

	// Cleanup on component unmount
	onMount(() => {
		return cleanup;
	});

	async function upgradeGuildHall() {
		if (!$guildHall) return;
		clearError();
		await dispatchCommand('UpgradeFacility', {
			facility: $guildHall.id
		});
	}

	async function constructFacility(facilityType: 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot') {
		clearError();
		await dispatchCommand('ConstructFacility', {
			facilityType
		});
	}

	function getFacilityDisplayName(facilityType: string): string {
		const names: Record<string, string> = {
			Dormitory: 'Dormitory',
			MissionCommand: 'Mission Command',
			TrainingGrounds: 'Training Grounds',
			ResourceDepot: 'Resource Depot'
		};
		return names[facilityType] || facilityType;
	}

	function getConstructionCost(facilityType: string): number {
		if (!$gameState) return 0;
		const cost = getFacilityConstructionCost(facilityType);
		return cost.get('gold') || 0;
	}

	function canAffordConstruction(facilityType: string): boolean {
		if (!$gameState) return false;
		return canAffordFacilityConstruction($gameState, facilityType);
	}
</script>

<div class="facilities-panel">
	<h2>Facilities</h2>
	
	<ErrorMessage message={$error} />

	<div class="capacity-summary">
		<h3>Mission Slots: {String($missionSlotCapacity.current)} / {String($missionSlotCapacity.max)}</h3>
		<div class="capacity-bar">
			<div class="capacity-bar-fill" style="width: {String(($missionSlotCapacity.max > 0 ? ($missionSlotCapacity.current / $missionSlotCapacity.max) : 0) * 100)}%"></div>
		</div>
		{#if $missionSlotCapacity.available > 0}
			<div class="capacity-available">{String($missionSlotCapacity.available)} slot{$missionSlotCapacity.available === 1 ? '' : 's'} available</div>
		{:else}
			<div class="capacity-full">All slots in use</div>
		{/if}
	</div>
	
	<div class="facilities-grid">
		{#each $facilities as facility}
			<div class="facility-card">
				<h3>{facility.metadata.displayName || facility.attributes.facilityType}</h3>
				<div class="facility-info">
					<div>Tier: {String(facility.attributes.tier)}</div>
					<div>State: {facility.state}</div>
				</div>
				{#if facility.attributes.facilityType === 'Guildhall' || facility.attributes.facilityType === 'MissionCommand'}
					<SlotPanel {facility} />
				{/if}
				{#if facility.attributes.facilityType === 'Guildhall'}
					{#if $guildHall}
						{#if $canUpgradeGuildHallState && $guildHallUpgradeCost}
							<div class="upgrade-section">
								<div class="upgrade-cost">
									Upgrade Cost: {String($guildHallUpgradeCost.get('gold') ?? 0)} gold
								</div>
								<button 
									class="upgrade-button"
									onclick={upgradeGuildHall}
								>
									{#if facility.attributes.tier === 0}
										Repair Guild Hall (Tier 0 → 1)
									{:else}
										Upgrade to Tier {String(facility.attributes.tier + 1)}
									{/if}
								</button>
							</div>
						{:else if facility.attributes.tier === 0 && $guildHallUpgradeCost}
							<div class="upgrade-section">
								<div class="upgrade-cost">
									Upgrade Cost: {String($guildHallUpgradeCost.get('gold') ?? 0)} gold
								</div>
								<button 
									class="upgrade-button"
									class:disabled={!$canUpgradeGuildHallState}
									onclick={upgradeGuildHall}
									disabled={!$canUpgradeGuildHallState}
								>
									Repair Guild Hall (Tier 0 → 1)
								</button>
							</div>
						{/if}
					{/if}
				{/if}
			</div>
		{/each}

		{#each $availableFacilities as facilityType}
			<div class="facility-card available">
				<h3>{getFacilityDisplayName(facilityType)}</h3>
				<div class="facility-info">
					<div>Status: Available to Build</div>
					<div>Tier: 1 (after construction)</div>
				</div>
				<div class="construction-section">
					<div class="construction-cost">
						Cost: {String(getConstructionCost(facilityType))} gold
						{#if !canAffordConstruction(facilityType)}
							<span class="insufficient-funds">(Insufficient gold)</span>
						{/if}
					</div>
					<button 
						class="construct-button"
						class:disabled={!canAffordConstruction(facilityType)}
						onclick={() => constructFacility(facilityType as 'Dormitory' | 'MissionCommand' | 'TrainingGrounds' | 'ResourceDepot')}
						disabled={!canAffordConstruction(facilityType)}
					>
						Build {getFacilityDisplayName(facilityType)}
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.facilities-panel {
		padding: 1rem;
	}

	.facilities-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.facilities-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.facility-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.facility-card h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
	}

	.facility-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.upgrade-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border, #ddd);
	}

	.upgrade-cost {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.5rem;
	}

	.upgrade-button {
		padding: 0.5rem 1rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.upgrade-button:hover:not(.disabled) {
		background: var(--color-primary-hover, #0052a3);
	}

	.upgrade-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.capacity-summary {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.capacity-summary h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.2rem;
	}

	.capacity-bar {
		width: 100%;
		height: 20px;
		background: var(--color-bg-tertiary, #e0e0e0);
		border-radius: 10px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.capacity-bar-fill {
		height: 100%;
		background: var(--color-primary, #0066cc);
		transition: width 0.3s ease;
	}

	.capacity-available {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.capacity-full {
		font-size: 0.9rem;
		color: #c33;
	}

	.facility-card.available {
		border: 2px dashed var(--color-primary, #0066cc);
		background: var(--color-bg-tertiary, #f0f0f0);
	}

	.construction-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border, #ddd);
	}

	.construction-cost {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.5rem;
	}

	.insufficient-funds {
		color: #c33;
		font-weight: bold;
	}

	.construct-button {
		padding: 0.5rem 1rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		width: 100%;
	}

	.construct-button:hover:not(.disabled) {
		background: var(--color-primary-hover, #0052a3);
	}

	.construct-button.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

