<script lang="ts">
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let progress: number; // 0-1
	export let label: string = '';
	export let showPercentage: boolean = true;
	export let variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

	// Smooth animation for progress changes
	const animatedProgress = tweened(progress, {
		duration: 200,
		easing: cubicOut
	});

	$: animatedProgress.set(progress);

	const variantClasses = {
		default: 'progress-default',
		success: 'progress-success',
		warning: 'progress-warning',
		danger: 'progress-danger'
	};
</script>

<div class="progress-container" class:variant-default={variant === 'default'} class:variant-success={variant === 'success'} class:variant-warning={variant === 'warning'} class:variant-danger={variant === 'danger'}>
	{#if label}
		<div class="progress-label">{label}</div>
	{/if}
	<div class="progress-bar">
		<div
			class="progress-fill {variantClasses[variant]}"
			style="width: {$animatedProgress * 100}%"
		></div>
	</div>
	{#if showPercentage}
		<div class="progress-text">{Math.round($animatedProgress * 100)}%</div>
	{/if}
</div>

<style>
	.progress-container {
		width: 100%;
	}

	.progress-label {
		font-size: 0.9em;
		margin-bottom: 0.25rem;
		color: #666;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #eee;
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.1s linear;
		position: relative;
	}

	.progress-default {
		background: #4caf50;
	}

	.progress-success {
		background: #66bb6a;
	}

	.progress-warning {
		background: #ff9800;
	}

	.progress-danger {
		background: #f44336;
	}

	.progress-text {
		font-size: 0.85em;
		color: #666;
		margin-top: 0.25rem;
		text-align: right;
	}
</style>

