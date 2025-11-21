<script lang="ts">
	import { getContext } from 'svelte';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { 
		recruitPool, 
		refreshRecruitPoolCost, 
		canAffordRefreshRecruitPoolState 
	} from '$lib/stores/gameState';
	import RecruitPreviewCard from './RecruitPreviewCard.svelte';
	import RecruitPreviewModal from './RecruitPreviewModal.svelte';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let selectedPreview: Adventurer | null = null;
	let modalOpen = false;

	$: refreshCost = $refreshRecruitPoolCost?.get('gold') ?? 5;
	$: canAffordRefresh = $canAffordRefreshRecruitPoolState;

	function handlePreviewClick(adventurer: Adventurer) {
		selectedPreview = adventurer;
		modalOpen = true;
	}

	function handleCloseModal() {
		modalOpen = false;
		selectedPreview = null;
	}

	async function handleRefresh() {
		if (!canAffordRefresh) return;
		await dispatchCommand(runtime, 'RefreshRecruitPool', {});
	}
</script>

<div class="recruit-pool">
	<div class="pool-header">
		<h3>Recruiting Pool</h3>
		<button 
			class="refresh-button"
			onclick={handleRefresh}
			disabled={!canAffordRefresh}
			title="Refresh pool (costs {refreshCost} gold)"
		>
			Refresh Pool ({refreshCost} gold)
		</button>
	</div>

	{#if $recruitPool.length === 0}
		<div class="empty-state">
			<p>No candidates available. Refresh the pool to see new recruits.</p>
		</div>
	{:else}
		<div class="pool-grid">
			{#each $recruitPool as previewAdventurer}
				<RecruitPreviewCard 
					adventurer={previewAdventurer}
					onClick={() => handlePreviewClick(previewAdventurer)}
				/>
			{/each}
		</div>
	{/if}
</div>

{#if selectedPreview}
	<RecruitPreviewModal 
		adventurer={selectedPreview}
		open={modalOpen}
		onClose={handleCloseModal}
	/>
{/if}

<style>
	.recruit-pool {
		margin-bottom: 2rem;
	}

	.pool-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.pool-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.refresh-button {
		padding: 0.5rem 1rem;
		background-color: var(--color-primary, #1976d2);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.refresh-button:hover:not(:disabled) {
		background-color: var(--color-primary-dark, #1565c0);
	}

	.refresh-button:disabled {
		background-color: var(--color-disabled, #ccc);
		cursor: not-allowed;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
	}

	.pool-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}
</style>

