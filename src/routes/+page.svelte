<script lang="ts">
	import { gameState } from '$lib/stores/gameState';
	import MainLayout from '$lib/components/layout/MainLayout.svelte';
</script>

{#if $gameState}
	<MainLayout />
{:else}
	<div>Loading...</div>
{/if}
