<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { startHeartbeat } from '$lib/stores/heartbeat';
	import { updateOrganizationFromServer } from '$lib/stores/organization';
	import '../app.css';

	let { children } = $props();
	let cleanupHeartbeat: (() => void) | null = null;

	onMount(async () => {
		// Bootstrap organization on mount
		try {
			const response = await fetch('/api/organization/bootstrap');
			const data = await response.json();
			updateOrganizationFromServer(data.snapshot, data.serverTime);

			// Start heartbeat
			cleanupHeartbeat = startHeartbeat();
		} catch (error) {
			console.error('[Layout] Failed to bootstrap:', error);
		}
	});

	onDestroy(() => {
		if (cleanupHeartbeat) {
			cleanupHeartbeat();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>
