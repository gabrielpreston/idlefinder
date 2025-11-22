<script lang="ts">
	import { missionDoctrine } from '$lib/stores/gameState';
	import { onMount } from 'svelte';
	import { dispatchCommand } from '$lib/bus/commandDispatcher';
	import { useCommandError } from '$lib/composables/useCommandError';
	import { ErrorMessage } from '$lib/components/ui';

	// Use composable for command error handling
	const { error, clearError, cleanup } = useCommandError(['UpdateMissionDoctrine']);

	// Cleanup on component unmount
	onMount(() => {
		return cleanup;
	});

	async function updateDoctrine(
		focus?: 'gold' | 'xp' | 'materials' | 'balanced',
		riskTolerance?: 'low' | 'medium' | 'high'
	) {
		clearError();
		await dispatchCommand('UpdateMissionDoctrine', {
			focus,
			riskTolerance
		});
	}
</script>

<div class="doctrine-panel">
	<h2>Mission Doctrine</h2>
	
	<ErrorMessage message={$error} />
	
	{#if $missionDoctrine}
		<div class="doctrine-section">
			<label>
				<span>Focus:</span>
				<select
					value={$missionDoctrine.attributes.focus}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						if (target) {
							updateDoctrine(target.value as 'gold' | 'xp' | 'materials' | 'balanced' | undefined, undefined);
						}
					}}
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
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						if (target) {
							updateDoctrine(undefined, target.value as 'low' | 'medium' | 'high' | undefined);
						}
					}}
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

