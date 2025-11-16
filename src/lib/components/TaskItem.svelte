<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { createTaskStore } from '$lib/stores/lifecycleStores';
	import { entityStoreRegistry } from '$lib/stores/lifecycleStores';
	import { DurationProgress } from './ui';

	export let taskId: string;

	const dispatch = createEventDispatcher();
	const taskStore = createTaskStore(taskId);

	let previousStatus: string | null = null;

	// Reactively detect changes
	$: if ($taskStore) {
		const task = $taskStore;

		// Detect status changes
		if (previousStatus !== null && task.status !== previousStatus) {
			dispatch('status-changed', {
				taskId,
				oldStatus: previousStatus,
				newStatus: task.status
			});

			if (task.status === 'COMPLETED') {
				dispatch('completed', {
					taskId
				});
			}
		}
		previousStatus = task.status;
	}

	onDestroy(() => {
		// Clean up store when component is destroyed
		entityStoreRegistry.remove('task', taskId);
	});
</script>

{#if $taskStore}
	<div class="task-instance">
		<h3>{$taskStore.category}</h3>
		<DurationProgress
			startTime={$taskStore.startedAt}
			duration={$taskStore.expectedCompletionAt - $taskStore.startedAt}
			label={$taskStore.category}
		/>
		<div class="task-info">
			<p>Status: {$taskStore.status}</p>
			<p>Agents: {$taskStore.assignedAgentIds.length}</p>
		</div>
	</div>
{/if}

<style>
	.task-instance {
		padding: 1rem;
		margin: 1rem 0;
		border: 1px solid #eee;
		border-radius: 4px;
	}

	.task-instance h3 {
		margin-top: 0;
	}

	.task-info {
		display: flex;
		gap: 1rem;
		font-size: 0.9em;
		color: #666;
		margin-top: 0.5rem;
	}
</style>

