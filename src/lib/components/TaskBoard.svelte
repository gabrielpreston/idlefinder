<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { organizationStore, updateOrganizationFromServer } from '$lib/stores/organization';
	import { useComponentDataLoader } from '$lib/stores/componentDataLoader';
	import { PollingTier } from '$lib/stores/dataPolling';
	import { lifecycleEvents, EventPriority } from '$lib/stores/lifecycleEvents';
	import type { TaskOfferDTO, AgentDTO } from '$lib/types';

	let offers: TaskOfferDTO[] = [];
	let agents: AgentDTO[] = [];
	let loading = false;
	let error: string | null = null;
	let cleanupOffers: (() => void) | null = null;
	let cleanupAgents: (() => void) | null = null;

	async function loadOffers() {
		const org = $organizationStore;
		if (!org) {
			return;
		}

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/organization/task-board?organizationId=${org.id}`);
			if (!response.ok) {
				throw new Error(`Failed to load offers: ${response.statusText}`);
			}
			offers = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load offers';
			console.error('[TaskBoard] Error loading offers:', err);
		} finally {
			loading = false;
		}
	}

	async function loadAgents() {
		const org = $organizationStore;
		if (!org) {
			return;
		}

		try {
			const response = await fetch(`/api/agents?organizationId=${org.id}`);
			if (!response.ok) {
				throw new Error(`Failed to load agents: ${response.statusText}`);
			}
			agents = await response.json();
		} catch (err) {
			console.error('[TaskBoard] Error loading agents:', err);
		}
	}

	async function startTask(offerId: string, agentIds: string[]) {
		const org = $organizationStore;
		if (!org) {
			return;
		}

		try {
			const response = await fetch('/api/tasks/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organizationId: org.id,
					offerId,
					agentIds
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to start task');
			}

			const result = await response.json();
			
			// Update organization store immediately with updated snapshot
			if (result.snapshot && result.serverTime) {
				updateOrganizationFromServer(result.snapshot, result.serverTime);
			}
			
			// Reload offers after starting task (agents will update reactively via AgentItem)
			await loadOffers();
			
			// Clear error on success
			error = null;
			
			// Trigger a page-level event to refresh ActiveTasks component
			lifecycleEvents.dispatch('task-started', {}, EventPriority.CRITICAL);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start task';
			console.error('[TaskBoard] Error starting task:', err);
		}
	}

	onMount(() => {
		// Use composable twice (once for offers, once for agents)
		// Both listen to same 'tasks-completed' event, each has independent polling instance
		cleanupOffers = useComponentDataLoader(loadOffers, {
			pollingTier: PollingTier.HIGH,
			events: ['tasks-completed'],
			checkStore: organizationStore
		});

		cleanupAgents = useComponentDataLoader(loadAgents, {
			pollingTier: PollingTier.HIGH,
			events: ['tasks-completed'],
			checkStore: organizationStore
		});
	});

	onDestroy(() => {
		if (cleanupOffers) {
			cleanupOffers();
		}
		if (cleanupAgents) {
			cleanupAgents();
		}
	});
</script>

<div class="task-board">
	<h2>Available Tasks</h2>

	{#if loading}
		<div>Loading offers...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if offers.length === 0}
		<div>No available tasks</div>
	{:else}
		{#each offers as offer}
			<div class="task-offer">
				<h3>{offer.category}</h3>
				<p>Agents: {offer.minAgents}-{offer.maxAgents}</p>
				<div class="cost-reward">
					<p>
						Cost:
						{#each Object.entries(offer.entryCost) as [type, amount]}
							{type}: {amount}
						{/each}
					</p>
					<p>
						Reward:
						{#each Object.entries(offer.baseReward) as [type, amount]}
							{type}: {amount}
						{/each}
					</p>
				</div>
				{#if offer.expiresAt}
					<p class="expires">Expires: {new Date(offer.expiresAt).toLocaleTimeString()}</p>
				{/if}

				<!-- Agent selection (simplified for MVP - just use first available agent) -->
				<button
					onclick={() => {
						const availableAgents = agents.filter((a) => a.status === 'IDLE');
						if (availableAgents.length >= offer.minAgents) {
							const selectedAgents = availableAgents
								.slice(0, Math.min(offer.maxAgents, availableAgents.length))
								.map((a) => a.id);
							startTask(offer.id, selectedAgents);
						} else {
							error = `Need at least ${offer.minAgents} available agents (found ${availableAgents.length})`;
						}
					}}
				>
					Start Task
				</button>
			</div>
		{/each}
	{/if}
</div>

<style>
	.task-board {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.task-board h2 {
		margin-top: 0;
	}

	.task-offer {
		padding: 1rem;
		margin: 1rem 0;
		border: 1px solid #eee;
		border-radius: 4px;
	}

	.task-offer h3 {
		margin-top: 0;
	}

	.cost-reward {
		margin: 0.5rem 0;
	}

	.expires {
		font-size: 0.9em;
		color: #666;
	}

	button {
		background: #4caf50;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 0.5rem;
	}

	button:hover {
		background: #45a049;
	}

	.error {
		color: #d32f2f;
		padding: 0.5rem;
		background: #ffebee;
		border-radius: 4px;
	}
</style>

