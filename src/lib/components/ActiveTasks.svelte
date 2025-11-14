<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { organizationStore } from '$lib/stores/organization';
	import { useComponentDataLoader } from '$lib/stores/componentDataLoader';
	import { PollingTier } from '$lib/stores/dataPolling';
	import { triggerHeartbeat } from '$lib/stores/heartbeat';
	import { lifecycleEvents } from '$lib/stores/lifecycleEvents';
	import TaskItem from './TaskItem.svelte';
	import type { TaskInstanceDTO } from '$lib/types';

	let taskIds: string[] = [];
	let loading = false;
	let cleanup: (() => void) | null = null;

	async function loadTaskIds(): Promise<void> {
		const org = $organizationStore;
		if (!org) {
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/tasks/active?organizationId=${org.id}`);
			if (!response.ok) {
				throw new Error(`Failed to load active tasks: ${response.statusText}`);
			}
			const tasks: TaskInstanceDTO[] = await response.json();
			taskIds = tasks.map(t => t.id);
		} catch (error) {
			console.error('[ActiveTasks] Error loading tasks:', error);
		} finally {
			loading = false;
		}
	}

	function handleTaskCompleted(event: CustomEvent) {
		const { taskId } = event.detail;
		// Remove from list
		taskIds = taskIds.filter(id => id !== taskId);
		// Trigger heartbeat to update organization state (gold, etc.)
		triggerHeartbeat();
	}

	function handleStatusChanged(_event: CustomEvent) {
		// Status change handled silently
	}

	onMount(() => {
		// Load task IDs initially
		loadTaskIds();

		// Listen for new tasks using lifecycleEvents (fixes duplicate listener bug)
		// componentDataLoader also listens to 'task-started', so we use lifecycleEvents here
		// to avoid duplicate listeners
		const handleTaskStarted = () => {
			loadTaskIds();
		};
		const eventCleanup = lifecycleEvents.on('task-started', handleTaskStarted, {
			context: { component: 'ActiveTasks' }
		});

		// Use composable for polling task list (to detect new tasks)
		const pollingCleanup = useComponentDataLoader(loadTaskIds, {
			pollingTier: PollingTier.CRITICAL,
			events: ['task-started'],
			checkStore: organizationStore
		});

		// Store combined cleanup function
		cleanup = () => {
			eventCleanup();
			pollingCleanup();
		};
	});

	onDestroy(() => {
		if (cleanup) {
			cleanup();
		}
	});
</script>

<div class="active-tasks">
	<h2>Active Tasks</h2>

	{#if loading}
		<div>Loading tasks...</div>
	{:else if taskIds.length === 0}
		<div>No active tasks</div>
	{:else}
		{#each taskIds as taskId}
			<TaskItem
				{taskId}
				on:completed={handleTaskCompleted}
				on:status-changed={handleStatusChanged}
			/>
		{/each}
	{/if}
</div>

<style>
	.active-tasks {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.active-tasks h2 {
		margin-top: 0;
	}
</style>

