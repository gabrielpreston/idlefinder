<script lang="ts">
	import { organizationStore } from '$lib/stores/organization';
	import OrganizationOverview from '$lib/components/OrganizationOverview.svelte';
	import TaskBoard from '$lib/components/TaskBoard.svelte';
	import ActiveTasks from '$lib/components/ActiveTasks.svelte';
	import AgentRoster from '$lib/components/AgentRoster.svelte';
</script>

{#if $organizationStore}
	<div class="game-container">
		<OrganizationOverview />
		<div class="main-content">
			<TaskBoard />
			<ActiveTasks />
			<AgentRoster />
		</div>
	</div>
{:else}
	<div>Loading...</div>
{/if}

<style>
	.game-container {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.main-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
</style>
