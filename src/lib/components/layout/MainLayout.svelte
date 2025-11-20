<script lang="ts">
	import { writable } from 'svelte/store';
	import ResourceBar from './ResourceBar.svelte';
	import NavigationTabs from './NavigationTabs.svelte';
	import DashboardPanel from '../dashboard/DashboardPanel.svelte';
	import DoctrinePanel from '../doctrine/DoctrinePanel.svelte';
	import RosterPanel from '../roster/RosterPanel.svelte';
	import EquipmentPanel from '../equipment/EquipmentPanel.svelte';
	import CraftingPanel from '../crafting/CraftingPanel.svelte';
	import FacilitiesPanel from '../facilities/FacilitiesPanel.svelte';
	import MissionsPanel from '../missions/MissionsPanel.svelte';
	import DevTools from '../DevTools.svelte';
	import { adventurersPanelUnlocked, facilitiesPanelUnlocked, missionsPanelUnlocked, equipmentPanelUnlocked, craftingPanelUnlocked, doctrinePanelUnlocked, gameState } from '$lib/stores/gameState';
	import { getPanelUnlockReason, PANEL_IDS } from '$lib/domain/queries/UIGatingQueries';

	const activeTab = writable('dashboard');

	function handleTabChange(tab: string) {
		activeTab.set(tab);
	}

	function getLockedMessage(tab: string): string | null {
		if (!$gameState) return null;
		// Map tab IDs to panel IDs for UIGatingQueries
		const panelId = tab === 'roster' ? PANEL_IDS.ADVENTURERS : tab;
		return getPanelUnlockReason(panelId, $gameState);
	}
</script>

<div class="main-layout">
	<ResourceBar />
	<NavigationTabs {activeTab} onTabChange={handleTabChange} />
	<div class="content-area">
		{#if $activeTab === 'dashboard'}
			<DashboardPanel />
		{:else if $activeTab === 'facilities'}
			{#if $facilitiesPanelUnlocked}
				<FacilitiesPanel />
			{:else}
				<div class="locked-panel">
					<h2>Facilities</h2>
					<p class="locked-message">{getLockedMessage('facilities') || 'This panel is locked'}</p>
				</div>
			{/if}
		{:else if $activeTab === 'missions'}
			{#if $missionsPanelUnlocked}
				<MissionsPanel />
			{:else}
				<div class="locked-panel">
					<h2>Missions</h2>
					<p class="locked-message">{getLockedMessage('missions') || 'This panel is locked'}</p>
				</div>
			{/if}
		{:else if $activeTab === 'roster'}
			{#if $adventurersPanelUnlocked}
				<RosterPanel />
			{:else}
				<div class="locked-panel">
					<h2>Roster</h2>
					<p class="locked-message">{getLockedMessage('roster') || 'This panel is locked'}</p>
				</div>
			{/if}
		{:else if $activeTab === 'equipment'}
			{#if $equipmentPanelUnlocked}
				<EquipmentPanel />
			{:else}
				<div class="locked-panel">
					<h2>Equipment</h2>
					<p class="locked-message">{getLockedMessage('equipment') || 'This panel is locked'}</p>
				</div>
			{/if}
		{:else if $activeTab === 'crafting'}
			{#if $craftingPanelUnlocked}
				<CraftingPanel />
			{:else}
				<div class="locked-panel">
					<h2>Crafting</h2>
					<p class="locked-message">{getLockedMessage('crafting') || 'This panel is locked'}</p>
				</div>
			{/if}
		{:else if $activeTab === 'doctrine'}
			{#if $doctrinePanelUnlocked}
				<DoctrinePanel />
			{:else}
				<div class="locked-panel">
					<h2>Doctrine</h2>
					<p class="locked-message">{getLockedMessage('doctrine') || 'This panel is locked'}</p>
				</div>
			{/if}
		{/if}
	</div>
	<DevTools />
</div>

<style>
	.main-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.content-area {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		background: var(--color-bg-primary, #fff);
	}

	.locked-panel {
		padding: 2rem;
		text-align: center;
	}

	.locked-message {
		color: var(--color-text-secondary, #666);
		font-style: italic;
		margin-top: 1rem;
	}
</style>

