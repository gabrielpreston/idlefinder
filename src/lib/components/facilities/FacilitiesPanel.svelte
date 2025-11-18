<script lang="ts">
	import { facilities } from '$lib/stores/gameState';
	import SlotPanel from './SlotPanel.svelte';
</script>

<div class="facilities-panel">
	<h2>Facilities</h2>
	
	<div class="facilities-grid">
		{#each $facilities as facility}
			<div class="facility-card">
				<h3>{facility.metadata.displayName || facility.attributes.facilityType}</h3>
				<div class="facility-info">
					<div>Tier: {facility.attributes.tier}</div>
					<div>State: {facility.state}</div>
				</div>
				{#if facility.attributes.facilityType === 'Guildhall'}
					<SlotPanel {facility} />
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.facilities-panel {
		padding: 1rem;
	}

	.facilities-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.facilities-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.facility-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.facility-card h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
	}

	.facility-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
	}
</style>

