<script lang="ts">
	import { getContext } from 'svelte';
	import Modal from '../ui/Modal.svelte';
	import Badge from '../ui/Badge.svelte';
	import { getPathfinderClass, getPathfinderAncestry } from '$lib/domain/data/pathfinder';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { recruitAdventurerCost, canAffordRecruitAdventurerState } from '$lib/stores/gameState';
	import type { Adventurer } from '$lib/domain/entities/Adventurer';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

	export let adventurer: Adventurer | null = null;
	export let open: boolean = false;
	export let onClose: () => void = () => {};

	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let name = '';
	let error: string | null = null;

	$: className = adventurer ? getPathfinderClass(adventurer.attributes.classKey as any)?.name || adventurer.attributes.classKey : '';
	$: ancestryName = adventurer ? getPathfinderAncestry(adventurer.attributes.ancestryKey as any)?.name || adventurer.attributes.ancestryKey : '';
	$: cost = $recruitAdventurerCost?.get('gold') ?? 50;
	$: canAfford = $canAffordRecruitAdventurerState;

	async function handleRecruit() {
		if (!adventurer) return;
		
		if (!name.trim()) {
			error = 'Please enter a name';
			return;
		}

		if (!canAfford) {
			error = 'Insufficient gold';
			return;
		}

		error = null;
		await dispatchCommand(runtime, 'RecruitAdventurer', {
			name: name.trim(),
			traits: [],
			previewAdventurerId: adventurer.id
		});

		// Clear form and close
		name = '';
		onClose();
	}

	function handleClose() {
		name = '';
		error = null;
		onClose();
	}
</script>

<Modal {open} title="Recruit Adventurer" on:close={handleClose}>
	{#if adventurer}
		<div class="preview-details">
			<div class="preview-header">
				<h3>{className} • {ancestryName}</h3>
				<Badge variant="default" size="small">
					{adventurer.attributes.roleKey.replace(/_/g, ' ')}
				</Badge>
			</div>

			<div class="preview-stats">
				<div class="stat-row">
					<span class="stat-label">Level:</span>
					<span class="stat-value">{adventurer.attributes.level}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Base HP:</span>
					<span class="stat-value">{adventurer.attributes.baseHP}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Class:</span>
					<span class="stat-value">{className}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Ancestry:</span>
					<span class="stat-value">{ancestryName}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Role:</span>
					<span class="stat-value">{adventurer.attributes.roleKey.replace(/_/g, ' ')}</span>
				</div>
			</div>

			<div class="recruit-form">
				<label for="adventurer-name">Name your adventurer:</label>
				<input 
					id="adventurer-name"
					type="text" 
					bind:value={name} 
					placeholder="Enter name"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleRecruit();
						}
					}}
				/>
				
				{#if error}
					<div class="error">{error}</div>
				{/if}

				<div class="cost-info">
					Cost: <strong>{cost} gold</strong>
					{#if !canAfford}
						<span class="insufficient-funds">(Insufficient gold)</span>
					{/if}
				</div>

				<button 
					class="recruit-button"
					onclick={handleRecruit}
					disabled={!canAfford || !name.trim()}
				>
					Recruit for {cost} gold
				</button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.preview-details {
		padding: 1rem 0;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border, #ddd);
	}

	.preview-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.preview-stats {
		margin-bottom: 1.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border-light, #eee);
	}

	.stat-label {
		font-weight: 600;
		color: var(--color-text-secondary, #666);
	}

	.stat-value {
		color: var(--color-text-primary, #000);
	}

	.recruit-form {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 2px solid var(--color-border, #ddd);
	}

	.recruit-form label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.recruit-form input {
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 1rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		font-size: 1rem;
	}

	.error {
		color: var(--color-error, #d32f2f);
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.cost-info {
		margin-bottom: 1rem;
		color: var(--color-text-secondary, #666);
	}

	.insufficient-funds {
		color: var(--color-error, #d32f2f);
		margin-left: 0.5rem;
	}

	.recruit-button {
		width: 100%;
		padding: 0.75rem;
		background-color: var(--color-primary, #1976d2);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.recruit-button:hover:not(:disabled) {
		background-color: var(--color-primary-dark, #1565c0);
	}

	.recruit-button:disabled {
		background-color: var(--color-disabled, #ccc);
		cursor: not-allowed;
	}
</style>

