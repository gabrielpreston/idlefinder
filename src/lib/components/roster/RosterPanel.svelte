<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { adventurers, recruitAdventurerCost, canAffordRecruitAdventurerState, resources } from '$lib/stores/gameState';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import type { CommandFailedEvent } from '$lib/bus/types';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

	// Get runtime from context
	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let name = '';
	let traits: string[] = [];
	let error: string | null = null;

	// Subscribe to command failures
	onMount(() => {
		const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
			const failed = payload as CommandFailedEvent;
			if (failed.commandType === 'RecruitAdventurer') {
				error = failed.reason;
			}
		});

		return unsubscribe;
	});

	async function recruit() {
		if (!name.trim()) {
			error = 'Please enter a name';
			return;
		}

		error = null;
		await dispatchCommand(runtime, 'RecruitAdventurer', {
			name: name.trim(),
			traits: traits.filter((t) => t.trim().length > 0)
		});

		// Clear form
		name = '';
		traits = [];
	}
</script>

<div class="roster-panel">
	<h2>Adventurer Roster</h2>
	
	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="recruit-form">
		<h3>Recruit New Adventurer</h3>
		<div class="recruit-inputs">
			<input type="text" bind:value={name} placeholder="Adventurer name" />
			<button 
				onclick={recruit} 
				disabled={!$canAffordRecruitAdventurerState || !name.trim()}
			>
				Recruit
			</button>
		</div>
		{#if $recruitAdventurerCost}
			<div class="recruit-cost">
				Cost: {$recruitAdventurerCost.get('gold')} gold
				{#if !$canAffordRecruitAdventurerState}
					<span class="insufficient-funds">
						(You have {$resources?.get('gold') ?? 0} gold)
					</span>
				{/if}
			</div>
		{/if}
	</div>
	
	<div class="adventurer-grid">
		{#if $adventurers.length === 0}
			<div class="empty-state">
				<p>No adventurers recruited yet. Recruit your first adventurer above to get started!</p>
			</div>
		{:else}
			{#each $adventurers as adventurer}
				<div class="adventurer-card">
					<div class="adventurer-header">
						<h3>{adventurer.metadata.displayName || adventurer.metadata.name || `Adventurer ${adventurer.id.slice(0, 8)}`}</h3>
						<span class="level-badge">Level {adventurer.attributes.level}</span>
					</div>
					<div class="adventurer-stats">
						<div>XP: {adventurer.attributes.xp}</div>
						<div>State: {adventurer.state === 'Idle' ? 'Available' : adventurer.state === 'OnMission' ? 'On Mission' : adventurer.state}</div>
						<div>Role: {adventurer.attributes.roleKey}</div>
					</div>
					{#if adventurer.attributes.equipment}
						<div class="equipment-preview">
							<div>Weapon: {adventurer.attributes.equipment.weaponId ? 'Equipped' : 'None'}</div>
							<div>Armor: {adventurer.attributes.equipment.armorId ? 'Equipped' : 'None'}</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.roster-panel {
		padding: 1rem;
	}

	.roster-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.error {
		color: red;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: #fee;
		border-radius: 4px;
		border: 1px solid #fcc;
	}

	.recruit-form {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border, #ddd);
	}

	.recruit-form h3 {
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.recruit-inputs {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.recruit-inputs input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		font-size: 1rem;
	}

	.recruit-inputs button {
		padding: 0.5rem 1rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
	}

	.recruit-inputs button:hover:not(:disabled) {
		background: var(--color-primary-dark, #0052a3);
	}

	.recruit-inputs button:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.recruit-cost {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}

	.insufficient-funds {
		color: #d00;
		font-weight: 600;
	}

	.adventurer-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.empty-state {
		grid-column: 1 / -1;
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
		background: var(--color-bg-secondary, #f9f9f9);
		border-radius: 8px;
		border: 1px dashed var(--color-border, #ddd);
	}

	.adventurer-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.adventurer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.adventurer-header h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.level-badge {
		padding: 0.25rem 0.5rem;
		background: var(--color-primary, #0066cc);
		color: white;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.adventurer-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.75rem;
	}

	.equipment-preview {
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #ddd);
		font-size: 0.85rem;
		color: var(--color-text-secondary, #666);
	}
</style>

