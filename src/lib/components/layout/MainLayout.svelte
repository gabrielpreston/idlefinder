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
	import DevTools from '../DevTools.svelte';

	const activeTab = writable('dashboard');

	function handleTabChange(tab: string) {
		activeTab.set(tab);
	}
</script>

<div class="main-layout">
	<ResourceBar />
	<NavigationTabs {activeTab} onTabChange={handleTabChange} />
	<div class="content-area">
		{#if $activeTab === 'dashboard'}
			<DashboardPanel />
		{:else if $activeTab === 'doctrine'}
			<DoctrinePanel />
		{:else if $activeTab === 'roster'}
			<RosterPanel />
		{:else if $activeTab === 'equipment'}
			<EquipmentPanel />
		{:else if $activeTab === 'crafting'}
			<CraftingPanel />
		{:else if $activeTab === 'facilities'}
			<FacilitiesPanel />
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
</style>

