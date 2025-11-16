<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { facilities, resources } from '$lib/stores/gameState';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { FacilitySystem } from '$lib/domain/systems';
	import type { CommandFailedEvent } from '$lib/bus/types';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

	// Get runtime from context
	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let error: string | null = null;
	const facilitySystem = new FacilitySystem();

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

	function canAfford(facility: 'tavern' | 'guildHall' | 'blacksmith'): boolean {
		if (!$facilities || !$resources) return false;
		const currentLevel = $facilities[facility].level;
		const cost = facilitySystem.getUpgradeCost(facility, currentLevel);
		return (
			$resources.gold >= cost.gold &&
			$resources.supplies >= cost.supplies &&
			$resources.relics >= cost.relics
		);
	}

	function getUpgradeCost(facility: 'tavern' | 'guildHall' | 'blacksmith'): {
		gold: number;
		supplies: number;
		relics: number;
	} {
		if (!$facilities) return { gold: 0, supplies: 0, relics: 0 };
		const currentLevel = $facilities[facility].level;
		return facilitySystem.getUpgradeCost(facility, currentLevel);
	}
</script>

<div class="facility-upgrades">
	<h2>Facilities</h2>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if $facilities}
		<div class="facility-list">
			{#each Object.entries($facilities) as [facility, facilityLevel]}
				<div class="facility-item">
					<div class="facility-header">
						<h3>{facility.charAt(0).toUpperCase() + facility.slice(1)}</h3>
						<span class="level">Level {facilityLevel.level}</span>
					</div>
					<div class="facility-effects">
						{#each facilityLevel.effects as effect}
							<div class="effect">{effect}</div>
						{/each}
					</div>
					{#if facilityLevel.level < 10}
						{@const cost = getUpgradeCost(facility as 'tavern' | 'guildHall' | 'blacksmith')}
						<div class="upgrade-section">
							<div class="cost">
								Cost: {cost.gold} gold, {cost.supplies} supplies
							</div>
							<button
								onclick={() => upgradeFacility(facility)}
								disabled={!canAfford(facility as 'tavern' | 'guildHall' | 'blacksmith')}
							>
								Upgrade
							</button>
						</div>
					{:else}
						<div class="max-level">Max Level</div>
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

