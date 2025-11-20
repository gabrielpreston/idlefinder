<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { facilities, guildHallUpgradeCost, canUpgradeGuildHallState, guildHall } from '$lib/stores/gameState';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import type { CommandFailedEvent } from '$lib/bus/types';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';
	import SlotPanel from './SlotPanel.svelte';

	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context');
	}

	let error: string | null = null;

	onMount(() => {
		const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
			const failed = payload as CommandFailedEvent;
			if (failed.commandType === 'UpgradeFacility') {
				error = failed.reason;
				setTimeout(() => { error = null; }, 5000);
			}
		});
		return unsubscribe;
	});

	async function upgradeGuildHall() {
		if (!$guildHall) return;
		error = null;
		await dispatchCommand(runtime, 'UpgradeFacility', {
			facility: $guildHall.id
		});
	}
</script>

<div class="facilities-panel">
	<h2>Facilities</h2>
	
	{#if error}
		<div class="error-message">{error}</div>
	{/if}
	
	<div class="facilities-grid">
		{#each $facilities as facility}
			<div class="facility-card">
				<h3>{facility.metadata.displayName || facility.attributes.facilityType}</h3>
				<div class="facility-info">
					<div>Tier: {facility.attributes.tier}</div>
					<div>State: {facility.state}</div>
				</div>
				{#if facility.attributes.facilityType === 'Guildhall'}
					<SlotPanel {facility} />
					{#if $guildHall}
						{#if $canUpgradeGuildHallState && $guildHallUpgradeCost}
							<div class="upgrade-section">
								<div class="upgrade-cost">
									Upgrade Cost: {$guildHallUpgradeCost.get('gold')} gold
								</div>
								<button 
									class="upgrade-button"
									onclick={upgradeGuildHall}
								>
									{#if facility.attributes.tier === 0}
										Repair Guild Hall (Tier 0 → 1)
									{:else}
										Upgrade to Tier {facility.attributes.tier + 1}
									{/if}
								</button>
							</div>
						{:else if facility.attributes.tier === 0 && $guildHallUpgradeCost}
							<div class="upgrade-section">
								<div class="upgrade-cost">
									Upgrade Cost: {$guildHallUpgradeCost.get('gold')} gold
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

	.error-message {
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 4px;
		color: #c33;
		font-size: 0.9rem;
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
</style>

