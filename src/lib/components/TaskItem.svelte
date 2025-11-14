<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { createTaskStore } from '$lib/stores/lifecycleStores';
	import { computeVisualProgress, serverTimeBaseline } from '$lib/stores/organization';
	import { entityStoreRegistry } from '$lib/stores/lifecycleStores';

	export let taskId: string;

	const dispatch = createEventDispatcher();
	const taskStore = createTaskStore(taskId);

	let previousStatus: string | null = null;
	let previousProgress = 0;

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

		// Detect progress changes (for visual updates)
		const progress = computeVisualProgress(
			task.startedAt,
			task.expectedCompletionAt,
			$serverTimeBaseline
		);

		if (Math.abs(progress - previousProgress) > 0.01) {
			dispatch('progress-updated', {
				taskId,
				progress
			});
			previousProgress = progress;
		}
	}

	onDestroy(() => {
		// Clean up store when component is destroyed
		entityStoreRegistry.remove('task', taskId);
	});
</script>

{#if $taskStore}
	<div class="task-instance">
		<h3>{$taskStore.category}</h3>
		<div class="progress-bar">
			<div
				class="progress-fill"
				style="width: {computeVisualProgress(
					$taskStore.startedAt,
					$taskStore.expectedCompletionAt,
					$serverTimeBaseline
				) * 100}%"
			></div>
		</div>
		<div class="task-info">
			<p>Status: {$taskStore.status}</p>
			<p>Agents: {$taskStore.assignedAgentIds.length}</p>
			<p>
				Progress: {Math.round(computeVisualProgress(
					$taskStore.startedAt,
					$taskStore.expectedCompletionAt,
					$serverTimeBaseline
				) * 100)}%
			</p>
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

	.progress-bar {
		width: 100%;
		height: 20px;
		background: #e0e0e0;
		border-radius: 10px;
		overflow: hidden;
		margin: 0.5rem 0;
	}

	.progress-fill {
		height: 100%;
		background: #4caf50;
		transition: width 0.1s ease-out;
	}

	.task-info {
		display: flex;
		gap: 1rem;
		font-size: 0.9em;
		color: #666;
	}
</style>

