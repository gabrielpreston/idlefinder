<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { adventurers } from '$lib/stores/gameState';
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

<div class="agent-roster">
	<h2>Adventurer Roster</h2>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="recruit-form">
		<h3>Recruit New Adventurer</h3>
		<input type="text" bind:value={name} placeholder="Adventurer name" />
		<button onclick={recruit}>Recruit</button>
	</div>

	<div class="adventurers-list">
		<h3>Adventurers ({$adventurers.length})</h3>
		{#if $adventurers.length === 0}
			<p>No adventurers recruited yet.</p>
		{:else}
			{#each $adventurers as adventurer}
				<div class="adventurer-item">
					<div class="adventurer-name">{adventurer.name}</div>
					<div class="adventurer-details">
						Level {adventurer.level} | XP: {adventurer.experience} | Status:{' '}
						{adventurer.status === 'idle' ? 'Available' : 'On Mission'}
					</div>
					{#if adventurer.traits.length > 0}
						<div class="adventurer-traits">
							Traits: {adventurer.traits.join(', ')}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.agent-roster {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.error {
		color: red;
		margin-bottom: 1rem;
	}

	.recruit-form {
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #eee;
	}

	.recruit-form input {
		margin-right: 0.5rem;
		padding: 0.5rem;
	}

	.adventurer-item {
		padding: 0.5rem;
		margin: 0.5rem 0;
		background: #f9f9f9;
		border-radius: 4px;
	}

	.adventurer-name {
		font-weight: bold;
	}

	.adventurer-details {
		font-size: 0.9em;
		color: #666;
	}

	.adventurer-traits {
		font-size: 0.85em;
		color: #888;
		margin-top: 0.25rem;
	}
</style>
