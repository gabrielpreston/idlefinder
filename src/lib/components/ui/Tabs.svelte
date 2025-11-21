<script lang="ts">
	export let tabs: Array<{ id: string; label: string }> = [];
	export let activeTab: string = '';
	// eslint-disable-next-line no-unused-vars
	export let onTabChange: (tabId: string) => void = () => {};

	function handleTabClick(tabId: string) {
		activeTab = tabId;
		onTabChange(tabId);
	}
</script>

<div class="tabs" role="tablist">
	{#each tabs as tab}
		<button
			class="tab-button"
			class:active={activeTab === tab.id}
			onclick={() => handleTabClick(tab.id)}
			role="tab"
			aria-selected={activeTab === tab.id}
			aria-controls="tab-panel-{tab.id}"
			id="tab-{tab.id}"
		>
			{tab.label}
		</button>
	{/each}
</div>

<div class="tab-content-container">
	<slot />
</div>

<style>
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border, #ddd);
	}

	.tab-button {
		padding: 0.5rem 1rem;
		border: none;
		background: transparent;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--color-text-secondary, #666);
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.tab-button:hover {
		color: var(--color-text-primary, #000);
		background: var(--color-bg-secondary, #f5f5f5);
	}

	.tab-button.active {
		color: var(--color-primary, #0066cc);
		border-bottom-color: var(--color-primary, #0066cc);
		font-weight: 600;
	}

	.tab-content-container {
		/* Container for tab content - parent handles conditional rendering */
	}
</style>

