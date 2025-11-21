<script lang="ts">
	import { rosterStatusSummary } from '$lib/stores/gameState';
	import Badge from '../ui/Badge.svelte';
</script>

<div class="adventurer-status">
	<h3>Adventurer Status</h3>
	<div class="status-badges">
		{#if $rosterStatusSummary.Idle !== undefined}
			<Badge variant="success" size="small">
				Idle: {$rosterStatusSummary.Idle}
			</Badge>
		{/if}
		{#if $rosterStatusSummary.OnMission !== undefined}
			<Badge variant="primary" size="small">
				On Mission: {$rosterStatusSummary.OnMission}
			</Badge>
		{/if}
		{#if $rosterStatusSummary.Fatigued !== undefined}
			<Badge variant="warning" size="small">
				Fatigued: {$rosterStatusSummary.Fatigued}
			</Badge>
		{/if}
		{#if $rosterStatusSummary.Recovering !== undefined}
			<Badge variant="default" size="small">
				Recovering: {$rosterStatusSummary.Recovering}
			</Badge>
		{/if}
		{#if Object.keys($rosterStatusSummary).length === 0}
			<div class="empty-state">No adventurers</div>
		{/if}
	</div>
</div>

<style>
	.adventurer-status {
		padding: 1rem;
	}

	.adventurer-status h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: var(--color-text-secondary, #666);
	}

	.status-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 0.5rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
		font-style: italic;
		font-size: 0.9rem;
	}
</style>

