<script lang="ts">
	import { onMount, getContext } from 'svelte';
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

	// For MVP: Simple mission offers (in future, this would come from a mission template system)
	const missionOffers = [
		{ id: 'mission-1', name: 'Explore Forest', duration: 60000 }, // 1 minute
		{ id: 'mission-2', name: 'Clear Cave', duration: 120000 }, // 2 minutes
		{ id: 'mission-3', name: 'Rescue Villagers', duration: 180000 } // 3 minutes
	];

	let error: string | null = null;
	let selectedMission: string | null = null;
	let selectedAdventurers: string[] = [];

	// Subscribe to command failures
	onMount(() => {
		const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
			const failed = payload as CommandFailedEvent;
			if (failed.commandType === 'StartMission') {
				error = failed.reason;
			}
		});

		return unsubscribe;
	});

	async function startMission() {
		if (!selectedMission) {
			error = 'Please select a mission';
			return;
		}

		if (selectedAdventurers.length === 0) {
			error = 'Please select at least one adventurer';
			return;
		}

		error = null;
		await dispatchCommand(runtime, 'StartMission', {
			missionId: selectedMission,
			adventurerIds: selectedAdventurers
		});

		// Clear selection
		selectedMission = null;
		selectedAdventurers = [];
	}

	function toggleAdventurer(id: string) {
		if (selectedAdventurers.includes(id)) {
			selectedAdventurers = selectedAdventurers.filter((aid) => aid !== id);
		} else {
			selectedAdventurers = [...selectedAdventurers, id];
		}
	}
</script>

<div class="task-board">
	<h2>Mission Board</h2>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="missions">
		<h3>Available Missions</h3>
		{#each missionOffers as offer}
			<label class="mission-option">
				<input
					type="radio"
					name="mission"
					value={offer.id}
					bind:group={selectedMission}
				/>
				<span>{offer.name} ({Math.floor(offer.duration / 1000)}s)</span>
			</label>
		{/each}
	</div>

	<div class="adventurers">
		<h3>Select Adventurers</h3>
		{#if $adventurers.length === 0}
			<p>No adventurers available. Recruit some first!</p>
		{:else}
			{#each $adventurers as adventurer}
				<label class="adventurer-option">
					<input
						type="checkbox"
						value={adventurer.id}
						checked={selectedAdventurers.includes(adventurer.id)}
						onchange={() => toggleAdventurer(adventurer.id)}
						disabled={adventurer.status === 'onMission'}
					/>
					<span>
						{adventurer.name} (Level {adventurer.level})
						{#if adventurer.status === 'onMission'}
							- On Mission
						{/if}
					</span>
				</label>
			{/each}
		{/if}
	</div>

	<button onclick={startMission} disabled={!selectedMission || selectedAdventurers.length === 0}>
		Start Mission
	</button>
</div>

<style>
	.task-board {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.error {
		color: red;
		margin-bottom: 1rem;
	}

	.missions,
	.adventurers {
		margin-bottom: 1rem;
	}

	.mission-option,
	.adventurer-option {
		display: block;
		margin: 0.5rem 0;
	}

	button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
	}
</style>
