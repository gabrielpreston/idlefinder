<script lang="ts">
	import ResourceSection from './ResourceSection.svelte';
	import RosterSection from './RosterSection.svelte';
	import MissionSection from './MissionSection.svelte';
	import FacilitySection from './FacilitySection.svelte';

	export let onViewState: (_state: 'Available' | 'InProgress' | 'Completed') => void = () => {};
	export let onViewAll: () => void = () => {};
</script>

<div class="dashboard-overview">
	<ResourceSection />
	<RosterSection />
	<MissionSection {onViewState} {onViewAll} />
	<FacilitySection />
</div>

<style>
	.dashboard-overview {
		padding: 1rem;
	}
</style>

