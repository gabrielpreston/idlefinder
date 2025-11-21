<script lang="ts">
	export let category: 'resources' | 'roster' | 'missions' | 'facilities' = 'resources';
	export let onBack: () => void = () => {};

	function getCategoryTitle(): string {
		switch (category) {
			case 'resources':
				return 'Resources';
			case 'roster':
				return 'Roster';
			case 'missions':
				return 'Missions';
			case 'facilities':
				return 'Facilities';
			default:
				return 'Collection';
		}
	}
</script>

<div class="dashboard-collection">
	<div class="collection-header">
		<button class="btn-back" onclick={onBack}>← Back to Overview</button>
		<h2>{getCategoryTitle()}</h2>
	</div>
	
	<div class="collection-content">
		<p class="placeholder">Collection view for {category} - To be implemented based on specific category needs</p>
	</div>
</div>

<style>
	.dashboard-collection {
		padding: 1rem;
	}

	.collection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.collection-header h2 {
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

	.collection-content {
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, #666);
	}

	.placeholder {
		font-style: italic;
	}
</style>

