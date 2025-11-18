<script lang="ts">
	import { adventurers, missions, resources } from '$lib/stores/gameState';
</script>

<div class="dashboard-panel">
	<h2>Dashboard</h2>
	
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">Adventurers</div>
			<div class="stat-value">{$adventurers.length}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Active Missions</div>
			<div class="stat-value">{$missions.filter(m => m.state === 'InProgress').length}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Gold</div>
			<div class="stat-value">{$resources?.get('gold') ?? 0}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Fame</div>
			<div class="stat-value">{$resources?.get('fame') ?? 0}</div>
		</div>
	</div>
</div>

<style>
	.dashboard-panel {
		padding: 1rem;
	}

	.dashboard-panel h2 {
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		padding: 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary, #000);
	}
</style>

