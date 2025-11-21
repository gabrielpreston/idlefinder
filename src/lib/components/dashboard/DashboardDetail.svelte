<script lang="ts">
	export let title: string = 'Detail';
	export let onBack: () => void = () => {};
</script>

<div class="dashboard-detail">
	<div class="detail-header">
		<button class="btn-back" onclick={onBack}>← Back</button>
		<h2>{title}</h2>
	</div>
	
	<div class="detail-content">
		<p class="placeholder">Detail view - To be implemented based on specific entity type</p>
	</div>
</div>

<style>
	.dashboard-detail {
		padding: 1rem;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.detail-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.btn-back {
		padding: 0.5rem 1rem;
		background: var(--color-bg-secondary, #f5f5f5);
		color: var(--color-text-primary, #000);
		border: 1px solid var(--color-border, #ddd);
		border-radius: 4px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-back:hover {
		background: var(--color-bg-primary, #fff);
	}

	.detail-content {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
	}

	.placeholder {
		font-style: italic;
	}
</style>

