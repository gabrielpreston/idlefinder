<script lang="ts">
	export let variant: 'default' | 'highlight' | 'warning' = 'default';
	export let padding: 'none' | 'small' | 'medium' | 'large' = 'medium';
	export let elevated: boolean = false;
</script>

<div 
	class="card" 
	class:variant-default={variant === 'default'}
	class:variant-highlight={variant === 'highlight'}
	class:variant-warning={variant === 'warning'}
	class:padding-none={padding === 'none'}
	class:padding-small={padding === 'small'}
	class:padding-medium={padding === 'medium'}
	class:padding-large={padding === 'large'}
	class:elevated={elevated}
>
	{#if $$slots.header}
		<div class="card-header">
			<slot name="header" />
		</div>
	{/if}
	
	<div class="card-body">
		<slot />
	</div>
	
	{#if $$slots.footer}
		<div class="card-footer">
			<slot name="footer" />
		</div>
	{/if}
</div>

<style>
	.card {
		background: var(--color-bg-secondary, #f5f5f5);
		border-radius: 8px;
		border: 1px solid var(--color-border, #ddd);
		display: flex;
		flex-direction: column;
	}

	.card.variant-default {
		background: var(--color-bg-secondary, #f5f5f5);
		border-color: var(--color-border, #ddd);
	}

	.card.variant-highlight {
		background: var(--color-bg-primary, #fff);
		border-color: var(--color-primary, #0066cc);
		border-width: 2px;
	}

	.card.variant-warning {
		background: var(--color-bg-secondary, #f5f5f5);
		border-color: var(--color-warning, #ff9800);
	}

	.card.elevated {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.card.padding-none {
		padding: 0;
	}

	.card.padding-small {
		padding: 0.5rem;
	}

	.card.padding-medium {
		padding: 1rem;
	}

	.card.padding-large {
		padding: 1.5rem;
	}

	.card-header {
		border-bottom: 1px solid var(--color-border, #ddd);
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
	}

	.card-body {
		flex: 1;
	}

	.card-footer {
		border-top: 1px solid var(--color-border, #ddd);
		margin-top: 0.75rem;
		padding-top: 0.75rem;
	}
</style>

