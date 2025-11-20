<script lang="ts">
	import TaskBoard from '../TaskBoard.svelte';
	import ActiveTasks from '../ActiveTasks.svelte';
</script>

<div class="missions-panel">
	<h2>Missions</h2>
	<TaskBoard />
	<ActiveTasks />
</div>

<style>
	.missions-panel {
		padding: 1rem;
	}

	.missions-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}
</style>

