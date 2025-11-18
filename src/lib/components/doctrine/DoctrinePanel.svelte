<script lang="ts">
	import { missionDoctrine } from '$lib/stores/gameState';
	import { getContext } from 'svelte';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context');
	}

	async function updateDoctrine(focus?: string, riskTolerance?: string) {
		await dispatchCommand(runtime, 'UpdateMissionDoctrine', {
			focus: focus as any,
			riskTolerance: riskTolerance as any
		});
	}
</script>

<div class="doctrine-panel">
	<h2>Mission Doctrine</h2>
	
	{#if $missionDoctrine}
		<div class="doctrine-section">
			<label>
				<span>Focus:</span>
				<select
					value={$missionDoctrine.attributes.focus}
					onchange={(e) => updateDoctrine(e.target.value, undefined)}
				>
					<option value="balanced">Balanced</option>
					<option value="gold">Gold</option>
					<option value="xp">XP</option>
					<option value="materials">Materials</option>
				</select>
			</label>
		</div>
		
		<div class="doctrine-section">
			<label>
				<span>Risk Tolerance:</span>
				<select
					value={$missionDoctrine.attributes.riskTolerance}
					onchange={(e) => updateDoctrine(undefined, e.target.value)}
				>
					<option value="low">Low</option>
					<option value="medium">Medium</option>
					<option value="high">High</option>
				</select>
			</label>
		</div>
	{:else}
		<p>No doctrine configured. Creating default...</p>
	{/if}
</div>

<style>
	.doctrine-panel {
		padding: 1rem;
	}

	.doctrine-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.doctrine-section {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
	}

	.doctrine-section label {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.doctrine-section span {
		font-weight: 600;
		min-width: 120px;
	}

	.doctrine-section select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
	}
</style>

