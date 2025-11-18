<script lang="ts">
	import { craftingQueue } from '$lib/stores/gameState';
</script>

<div class="crafting-panel">
	<h2>Crafting</h2>
	
	{#if $craftingQueue}
		<div class="queue-status">
			<div>Active Slots: {$craftingQueue.attributes.activeSlots}</div>
			<div>Queue Length: {$craftingQueue.getQueue().length}</div>
			<div>Active Jobs: {$craftingQueue.getActiveJobIds().length}</div>
		</div>
	{:else}
		<p>No crafting queue found. Creating default...</p>
	{/if}
</div>

<style>
	.crafting-panel {
		padding: 1rem;
	}

	.crafting-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.queue-status {
		display: flex;
		gap: 2rem;
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
	}
</style>

