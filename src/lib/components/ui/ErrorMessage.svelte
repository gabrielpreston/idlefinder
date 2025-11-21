<script lang="ts">
	export let message: string | null = null;
	export let persistent: boolean = false;
</script>

{#if message}
	<div class="error-message" class:persistent={persistent}>
		{message}
	</div>
{/if}

<style>
	.error-message {
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 4px;
		color: #c33;
		font-size: 0.9rem;
	}

	.error-message.persistent {
		border-width: 2px;
		font-weight: 600;
	}
</style>

