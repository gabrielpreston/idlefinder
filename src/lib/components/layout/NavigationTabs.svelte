<script lang="ts">
	import type { Writable } from 'svelte/store';
	export let activeTab: Writable<string>;
	export let onTabChange: (_tab: string) => void = () => {};

	const tabs = [
		{ id: 'dashboard', label: 'Dashboard' },
		{ id: 'doctrine', label: 'Doctrine' },
		{ id: 'roster', label: 'Roster' },
		{ id: 'equipment', label: 'Equipment' },
		{ id: 'crafting', label: 'Crafting' },
		{ id: 'facilities', label: 'Facilities' }
	];

	function handleTabClick(tabId: string) {
		activeTab.set(tabId);
		onTabChange(tabId);
	}
</script>

<nav class="navigation-tabs">
	{#each tabs as tab}
		<button
			class="tab-button"
			class:active={$activeTab === tab.id}
			onclick={() => handleTabClick(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</nav>

<style>
	.navigation-tabs {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-bg-primary, #fff);
		border-bottom: 1px solid var(--color-border, #ddd);
		overflow-x: auto;
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
</style>

