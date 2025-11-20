<script lang="ts">
	import type { Writable } from 'svelte/store';
	import { adventurersPanelUnlocked, facilitiesPanelUnlocked, missionsPanelUnlocked, equipmentPanelUnlocked, craftingPanelUnlocked, doctrinePanelUnlocked, gameState } from '$lib/stores/gameState';
	import { getPanelUnlockReason, PANEL_IDS } from '$lib/domain/queries/UIGatingQueries';
	
	export let activeTab: Writable<string>;
	export let onTabChange: (_tab: string) => void = () => {};

	const tabs = [
		{ id: 'dashboard', label: 'Dashboard', alwaysAvailable: true },
		{ id: 'facilities', label: 'Facilities', alwaysAvailable: false },
		{ id: 'missions', label: 'Missions', alwaysAvailable: false },
		{ id: 'roster', label: 'Roster', alwaysAvailable: false },
		{ id: 'equipment', label: 'Equipment', alwaysAvailable: false },
		{ id: 'crafting', label: 'Crafting', alwaysAvailable: false },
		{ id: 'doctrine', label: 'Doctrine', alwaysAvailable: false }
	];

	function isTabUnlocked(tabId: string): boolean {
		switch (tabId) {
			case 'dashboard':
				return true; // Always available
			case 'facilities':
				return $facilitiesPanelUnlocked;
			case 'missions':
				return $missionsPanelUnlocked;
			case 'roster':
				return $adventurersPanelUnlocked;
			case 'equipment':
				return $equipmentPanelUnlocked;
			case 'crafting':
				return $craftingPanelUnlocked;
			case 'doctrine':
				return $doctrinePanelUnlocked;
			default:
				return false;
		}
	}

	function getTabUnlockReason(tabId: string): string | null {
		if (isTabUnlocked(tabId)) return null;
		if (!$gameState) return 'Game not loaded';
		// Map tab IDs to panel IDs for UIGatingQueries
		const panelId = tabId === 'roster' ? PANEL_IDS.ADVENTURERS : tabId;
		const reason = getPanelUnlockReason(panelId, $gameState);
		// If no reason is provided but tab is locked, provide a default message
		if (!reason && !isTabUnlocked(tabId)) {
			return 'This panel is locked';
		}
		return reason;
	}

	function handleTabClick(tabId: string) {
		if (!isTabUnlocked(tabId)) return; // Prevent navigation to locked tabs
		activeTab.set(tabId);
		onTabChange(tabId);
	}
</script>

<nav class="navigation-tabs">
	{#each tabs as tab}
		<button
			class="tab-button"
			class:active={$activeTab === tab.id}
			class:locked={!isTabUnlocked(tab.id)}
			onclick={() => handleTabClick(tab.id)}
			title={getTabUnlockReason(tab.id) || ''}
		>
			{tab.label}
			{#if !isTabUnlocked(tab.id)}
				<span class="lock-icon">🔒</span>
			{/if}
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

	.tab-button.locked {
		opacity: 0.5;
		cursor: not-allowed;
		position: relative;
	}

	.lock-icon {
		margin-left: 0.25rem;
		font-size: 0.75rem;
	}
</style>

