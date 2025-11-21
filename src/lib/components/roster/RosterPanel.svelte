<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { adventurers } from '$lib/stores/gameState';
	import type { CommandFailedEvent } from '$lib/bus/types';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';
	import RosterOverview from './RosterOverview.svelte';
	import RosterToolbar from './RosterToolbar.svelte';
	import AdventurerGrid from './AdventurerGrid.svelte';
	import AdventurerDetailModal from './AdventurerDetailModal.svelte';
	import RecruitPool from './RecruitPool.svelte';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { AdventurerState } from '$lib/domain/states/AdventurerState';
	import type { RoleKey } from '$lib/domain/attributes/RoleKey';
	import { writable } from 'svelte/store';

	// Get runtime from context
	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let error: string | null = null;
	let selectedAdventurer = writable<Adventurer | null>(null);
	let filters = writable<{
		state: AdventurerState | 'all';
		role: RoleKey | 'all';
		search: string;
	}>({ state: 'all', role: 'all', search: '' });
	let sortBy = writable<'level' | 'xp' | 'name' | 'state'>('level');

	// Subscribe to command failures
	onMount(() => {
		const unsubscribe = runtime.busManager.domainEventBus.subscribe('CommandFailed', (payload) => {
			const failed = payload as CommandFailedEvent;
			if (failed.commandType === 'RecruitAdventurer' || failed.commandType === 'RefreshRecruitPool') {
				error = failed.reason;
			}
		});

		return unsubscribe;
	});

	function handleAdventurerClick(adventurer: Adventurer) {
		selectedAdventurer.set(adventurer);
	}

	function handleModalClose() {
		selectedAdventurer.set(null);
	}

</script>

<div class="roster-panel">
	<h2>Adventurer Roster</h2>
	
	{#if error}
		<div class="error">{error}</div>
	{/if}

	<RecruitPool />

	<RosterOverview />
	
	<RosterToolbar 
		filters={$filters}
		sortBy={$sortBy}
		on:filterChange={(e) => filters.set(e.detail)}
		on:sortChange={(e) => sortBy.set(e.detail)}
	/>
	
	<AdventurerGrid 
		adventurers={$adventurers}
		filters={$filters}
		sortBy={$sortBy}
		onAdventurerClick={handleAdventurerClick}
	/>
</div>

<AdventurerDetailModal 
	adventurer={$selectedAdventurer}
	open={$selectedAdventurer !== null}
	onClose={handleModalClose}
/>

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
</style>
