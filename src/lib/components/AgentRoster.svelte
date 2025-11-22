<script lang="ts">
	import { onMount } from 'svelte';
	import { adventurers } from '$lib/stores/gameState';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { useCommandError } from '$lib/composables/useCommandError';
	import { ErrorMessage } from '$lib/components/ui';

	let name = '';
	let traits: string[] = [];
	let validationError: string | null = null;

	// Use composable for command error handling
	const { error: commandError, clearError, cleanup } = useCommandError(['RecruitAdventurer']);

	// Cleanup on component unmount
	onMount(() => {
		return cleanup;
	});

	async function recruit() {
		if (!name.trim()) {
			validationError = 'Please enter a name';
			return;
		}

		validationError = null;
		clearError();
		await dispatchCommand('RecruitAdventurer', {
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

	<ErrorMessage message={validationError || $commandError} />

	<div class="recruit-form">
		<h3>Recruit New Adventurer</h3>
		<input type="text" bind:value={name} placeholder="Adventurer name" />
		<button onclick={recruit}>Recruit</button>
	</div>

	<div class="adventurers-list">
		<h3>Adventurers ({String($adventurers.length)})</h3>
		{#if $adventurers.length === 0}
			<p>No adventurers recruited yet.</p>
		{:else}
		{#each $adventurers as adventurer}
			<div class="adventurer-item">
				<div class="adventurer-name">{(adventurer.metadata.name as string) || 'Unnamed Adventurer'}</div>
				<div class="adventurer-details">
					Level {String(adventurer.attributes.level)} | XP: {String(adventurer.attributes.xp)} | Status:{' '}
					{adventurer.state === 'Idle' ? 'Available' : adventurer.state === 'OnMission' ? 'On Mission' : adventurer.state}
				</div>
				{#if adventurer.tags.length > 0}
					<div class="adventurer-traits">
						Traits: {adventurer.tags.join(', ')}
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
