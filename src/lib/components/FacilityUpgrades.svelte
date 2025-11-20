<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { facilities, resources, gameState } from '$lib/stores/gameState';
	import { calculateFacilityUpgradeCost, canAffordFacilityUpgrade } from '$lib/domain/queries/CostQueries';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import type { CommandFailedEvent } from '$lib/bus/types';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

	// Get runtime from context
	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let error: string | null = null;

	// Subscribe to command failures
	onMount(() => {
		const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
			const failed = payload as CommandFailedEvent;
			if (failed.commandType === 'UpgradeFacility') {
				error = failed.reason;
			}
		});

		return unsubscribe;
	});

	async function upgradeFacility(facility: string) {
		error = null;
		await dispatchCommand(runtime, 'UpgradeFacility', { facility });
	}

	function findFacility(facilityType: string) {
		if (!$facilities) return null;
		return $facilities.find(f => f.attributes.facilityType === facilityType) || null;
	}

	function canAfford(facilityType: string): boolean {
		if (!$facilities || !$resources || !$gameState) return false;
		const facility = findFacility(facilityType);
		if (!facility) return false;
		const currentTier = facility.attributes.tier;
		const targetTier = currentTier + 1;
		return canAffordFacilityUpgrade($gameState, targetTier);
	}

	function getUpgradeCost(facilityType: string): number {
		if (!$facilities || !$gameState) return 0;
		const facility = findFacility(facilityType);
		if (!facility) return 0;
		const currentTier = facility.attributes.tier;
		const targetTier = currentTier + 1;
		return calculateFacilityUpgradeCost(targetTier);
	}
</script>

<div class="facility-upgrades">
	<h2>Facilities</h2>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if $facilities && $facilities.length > 0}
		<div class="facility-list">
			{#each $facilities as facility}
				{@const facilityName = (facility.metadata.name as string) || facility.attributes.facilityType}
				{@const facilityType = facility.attributes.facilityType}
				<div class="facility-item">
					<div class="facility-header">
						<h3>{facilityName}</h3>
						<span class="level">Tier {facility.attributes.tier}</span>
					</div>
					<div class="facility-effects">
						<div class="effect">Capacity: {facility.attributes.baseCapacity}</div>
						{#if Object.keys(facility.attributes.bonusMultipliers).length > 0}
							{#each Object.entries(facility.attributes.bonusMultipliers) as [key, value]}
								<div class="effect">{key}: {value}</div>
							{/each}
						{/if}
					</div>
					{#if facility.attributes.tier < 10}
						{@const cost = getUpgradeCost(facilityType)}
						<div class="upgrade-section">
							<div class="cost">
								Cost: {cost} gold
							</div>
							<button
								onclick={() => upgradeFacility(facilityType)}
								disabled={!canAfford(facilityType)}
							>
								Upgrade
							</button>
						</div>
					{:else}
						<div class="max-level">Max Tier</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.facility-upgrades {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.error {
		color: red;
		margin-bottom: 1rem;
	}

	.facility-item {
		padding: 1rem;
		margin-bottom: 1rem;
		background: #f9f9f9;
		border-radius: 4px;
	}

	.facility-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.level {
		font-weight: bold;
		color: #666;
	}

	.facility-effects {
		margin: 0.5rem 0;
	}

	.effect {
		font-size: 0.9em;
		color: #666;
		margin: 0.25rem 0;
	}

	.upgrade-section {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #eee;
	}

	.cost {
		font-size: 0.9em;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.max-level {
		margin-top: 0.5rem;
		font-weight: bold;
		color: #666;
	}
</style>

