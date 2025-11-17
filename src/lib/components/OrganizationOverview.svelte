<script lang="ts">
	import { resources, missions } from '$lib/stores/gameState';
	import { AnimatedNumber } from './ui';
</script>

<div class="organization-overview">
	<h1>Guild Overview</h1>

	{#if $resources}
		<div class="resources">
			<h2>Resources</h2>
			<div class="resource-item">
				<span class="resource-label">Gold:</span>
				<span class="resource-value">
					<AnimatedNumber value={$resources.get('gold') || 0} />
				</span>
			</div>
			<div class="resource-item">
				<span class="resource-label">Fame:</span>
				<span class="resource-value">
					<AnimatedNumber value={$resources.get('fame') || 0} />
				</span>
			</div>
		</div>
	{/if}

	<div class="stats">
		<div class="stat-item">
			<span class="stat-label">Active Missions:</span>
			<span class="stat-value">{$missions.filter(m => m.state === 'InProgress').length}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Completed Missions:</span>
			<span class="stat-value">{$missions.filter(m => m.state === 'Completed').length}</span>
		</div>
	</div>
</div>

<style>
	.organization-overview {
		background: #fff;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #ddd;
		margin-bottom: 1rem;
	}

	.resources {
		margin-bottom: 1rem;
	}

	.resource-item,
	.stat-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
	}

	.resource-label,
	.stat-label {
		font-weight: bold;
	}

	.resource-value,
	.stat-value {
		color: #666;
	}
</style>
