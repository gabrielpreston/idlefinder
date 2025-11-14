<script lang="ts">
	import { organizationStore } from '$lib/stores/organization';
</script>

{#if $organizationStore}
	<div class="organization-overview">
		<h2>Organization</h2>
		<div class="resources">
			<h3>Resources</h3>
			{#each Object.entries($organizationStore.wallet) as [type, amount]}
				<div class="resource-item">
					<span class="resource-type">{type}:</span>
					<span class="resource-amount">{amount}</span>
				</div>
			{/each}
		</div>
		<div class="tracks">
			<h3>Progress Tracks</h3>
			{#each Object.entries($organizationStore.progressTracks) as [key, value]}
				<div class="track-item">
					<span class="track-key">{key}:</span>
					<span class="track-value">{value.toFixed(1)}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.organization-overview {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.organization-overview h2 {
		margin-top: 0;
	}

	.resources,
	.tracks {
		margin-top: 1rem;
	}

	.resource-item,
	.track-item {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem 0;
	}

	.resource-type,
	.track-key {
		font-weight: 500;
	}
</style>

