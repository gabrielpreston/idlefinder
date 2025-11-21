<script lang="ts">
	export let variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
	export let size: 'small' | 'medium' | 'large' = 'medium';
</script>

<span 
	class="badge"
	class:variant-default={variant === 'default'}
	class:variant-primary={variant === 'primary'}
	class:variant-success={variant === 'success'}
	class:variant-warning={variant === 'warning'}
	class:variant-danger={variant === 'danger'}
	class:size-small={size === 'small'}
	class:size-medium={size === 'medium'}
	class:size-large={size === 'large'}
>
	<slot />
</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		white-space: nowrap;
	}

	.badge.size-small {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
	}

	.badge.size-medium {
		font-size: 0.85rem;
		padding: 0.25rem 0.5rem;
	}

	.badge.size-large {
		font-size: 1rem;
		padding: 0.375rem 0.75rem;
	}

	.badge.variant-default {
		background: var(--color-bg-secondary, #e0e0e0);
		color: var(--color-text-primary, #333);
	}

	.badge.variant-primary {
		background: var(--color-primary, #0066cc);
		color: white;
	}

	.badge.variant-success {
		background: var(--color-success, #4caf50);
		color: white;
	}

	.badge.variant-warning {
		background: var(--color-warning, #ff9800);
		color: white;
	}

	.badge.variant-danger {
		background: var(--color-danger, #f44336);
		color: white;
	}
</style>

