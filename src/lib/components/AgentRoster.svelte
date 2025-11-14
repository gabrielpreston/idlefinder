<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { organizationStore } from '$lib/stores/organization';
	import { useComponentDataLoader } from '$lib/stores/componentDataLoader';
	import { PollingTier } from '$lib/stores/dataPolling';
	import AgentItem from './AgentItem.svelte';
	import type { AgentDTO } from '$lib/types';

	let agentIds: string[] = [];
	let loading = false;
	let cleanup: (() => void) | null = null;

	async function loadAgentIds(): Promise<void> {
		const org = $organizationStore;
		if (!org) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/agents?organizationId=${org.id}`);
			if (!response.ok) {
				throw new Error(`Failed to load agents: ${response.statusText}`);
			}
			const agents: AgentDTO[] = await response.json();
			agentIds = agents.map(a => a.id);
		} catch (error) {
			console.error('[AgentRoster] Error loading agents:', error);
		} finally {
			loading = false;
		}
	}

	function handleStatusChanged(_event: CustomEvent) {
		// Status change handled silently
	}

	function handleXpGained(_event: CustomEvent) {
		// XP gain handled silently
	}

	function handleLevelUp(_event: CustomEvent) {
		// Level up handled silently
	}

	onMount(() => {
		// Load agent IDs initially
		loadAgentIds();

		// Use composable for polling agent list (to detect new agents)
		cleanup = useComponentDataLoader(loadAgentIds, {
			pollingTier: PollingTier.HIGH,
			events: ['tasks-completed'],
			checkStore: organizationStore
		});
	});

	onDestroy(() => {
		if (cleanup) {
			cleanup();
		}
	});
</script>

<div class="agent-roster">
	<h2>Agents</h2>

	{#if loading}
		<div>Loading agents...</div>
	{:else if agentIds.length === 0}
		<div>No agents</div>
	{:else}
		<div class="agents-grid">
			{#each agentIds as agentId}
				<AgentItem
					{agentId}
					on:status-changed={handleStatusChanged}
					on:xp-gained={handleXpGained}
					on:level-up={handleLevelUp}
					on:injured={() => {}}
					on:recovered={() => {}}
					on:released={() => {}}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.agent-roster {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.agent-roster h2 {
		margin-top: 0;
	}

	.agents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
</style>

