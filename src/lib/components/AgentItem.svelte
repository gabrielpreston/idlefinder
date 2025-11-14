<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { createAgentStore } from '$lib/stores/lifecycleStores';
	import { entityStoreRegistry } from '$lib/stores/lifecycleStores';

	export let agentId: string;

	const dispatch = createEventDispatcher();
	const agentStore = createAgentStore(agentId);

	let previousStatus: string | null = null;
	let previousLevel = 0;
	let previousXP = 0;

	// Reactively detect changes
	$: if ($agentStore) {
		const agent = $agentStore;

		// Status changes
		if (previousStatus !== null && agent.status !== previousStatus) {
			dispatch('status-changed', {
				agentId,
				oldStatus: previousStatus,
				newStatus: agent.status
			});

			// Specific status change events
			if (previousStatus === 'ASSIGNED' && agent.status === 'IDLE') {
				dispatch('released', {
					agentId,
					taskId: agent.currentTaskId
				});
			}
			if (agent.status === 'INJURED') {
				dispatch('injured', { agentId });
			}
			if (previousStatus === 'INJURED' && agent.status === 'IDLE') {
				dispatch('recovered', { agentId });
			}
		}
		previousStatus = agent.status;

		// Level changes
		if (agent.level !== previousLevel) {
			dispatch('level-up', {
				agentId,
				oldLevel: previousLevel,
				newLevel: agent.level
			});
			previousLevel = agent.level;
		}

		// XP changes
		if (agent.experience !== previousXP) {
			const xpGained = agent.experience - previousXP;
			dispatch('xp-gained', {
				agentId,
				amount: xpGained,
				newTotal: agent.experience
			});
			previousXP = agent.experience;
		}
	}

	onDestroy(() => {
		// Clean up store when component is destroyed
		entityStoreRegistry.remove('agent', agentId);
	});
</script>

{#if $agentStore}
	<div class="agent-card">
		<h3>Agent {$agentStore.id.slice(0, 8)}</h3>
		<div class="agent-info">
			<p><strong>Level:</strong> {$agentStore.level}</p>
			<p><strong>XP:</strong> {$agentStore.experience}</p>
			<p><strong>Status:</strong> {$agentStore.status}</p>
		</div>
		<div class="agent-stats">
			<h4>Stats</h4>
			{#each Object.entries($agentStore.stats) as [key, value]}
				<div class="stat-item">
					<span class="stat-key">{key}:</span>
					<span class="stat-value">{value}</span>
				</div>
			{/each}
		</div>
		{#if $agentStore.currentTaskId}
			<p class="assigned">Assigned to: {$agentStore.currentTaskId.slice(0, 8)}</p>
		{/if}
	</div>
{/if}

<style>
	.agent-card {
		padding: 1rem;
		border: 1px solid #eee;
		border-radius: 4px;
		background: #fafafa;
	}

	.agent-card h3 {
		margin-top: 0;
		font-size: 1em;
	}

	.agent-info {
		margin: 0.5rem 0;
	}

	.agent-info p {
		margin: 0.25rem 0;
		font-size: 0.9em;
	}

	.agent-stats {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #eee;
	}

	.agent-stats h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9em;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		font-size: 0.85em;
		margin: 0.25rem 0;
	}

	.stat-key {
		font-weight: 500;
	}

	.assigned {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #eee;
		font-size: 0.85em;
		color: #666;
		font-style: italic;
	}
</style>

