<script lang="ts">
	import { getContext } from 'svelte';
	import { missions } from '$lib/stores/gameState';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';
	import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
	import { IdleLoop } from '$lib/domain/systems/IdleLoop';
	import { EntityQueryBuilder } from '$lib/domain/queries/EntityQueryBuilder';
	import type { Mission } from '$lib/domain/entities/Mission';

	// Get runtime from context
	const runtime = getContext<GameRuntime>(GAME_RUNTIME_KEY);
	if (!runtime) {
		throw new Error('GameRuntime not found in context. Ensure component is within +layout.svelte');
	}

	let showDevTools = false;
	let showDebugInfo = false;

	function resetGameState() {
		if (confirm('Reset all game state? This will clear your progress and reload the page.')) {
			try {
				// Step 1: Clear localStorage directly (most reliable)
				localStorage.removeItem('idlefinder_state');
				const afterClear = localStorage.getItem('idlefinder_state');
				
				if (afterClear) {
					localStorage.clear();
					const afterClearAll = localStorage.getItem('idlefinder_state');
					
					if (afterClearAll) {
						alert('ERROR: Could not clear localStorage. Please clear it manually:\n1. Open DevTools (F12)\n2. Go to Application tab\n3. Find Local Storage\n4. Delete idlefinder_state\n5. Reload page');
						return;
					}
				}
				
				// Step 2: Also try clearing via persistence bus if available
				try {
					runtime.busManager.persistenceBus.clear();
				} catch {
					// PersistenceBus not available (this is OK)
				}
				
				// Step 3: Verify it's actually gone
				const finalCheck = localStorage.getItem('idlefinder_state');
				if (finalCheck) {
					alert('Could not clear save data. Please use browser DevTools to manually delete it.');
					return;
				}
				
				// Step 4: Force hard reload (bypass cache)
				// Note: reload() no longer accepts arguments in modern browsers
				// Use location.href for hard reload with cache bypass
				setTimeout(() => {
					// Set a flag in sessionStorage to prevent auto-save during reload
					sessionStorage.setItem('__resetting', 'true');
					
					// Force hard reload by navigating to same URL with cache-busting parameter
					window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
				}, 100);
			} catch {
				alert('Error during reset. Please manually clear localStorage:\nlocalStorage.removeItem("idlefinder_state")');
			}
		}
	}

	function logMissionState() {
		// Function kept for button compatibility but no longer logs to console
	}

	async function triggerTick() {
		const tickBus = runtime.busManager.tickBus;
		const now = new Date();
		
		// Access tick handlers via public test helper
		try {
			// Get all tick handlers
			const handlers = tickBus.getHandlersForTesting();
			if (handlers && handlers.size > 0) {
				for (const handler of handlers) {
					await handler(1000, now); // 1 second delta
				}
			}
		} catch {
			// Error handling without console logging
		}
	}

	async function completeStuckMissions() {
		const state = runtime.busManager.getState();
		const now = Date.now();
		
		const missions = EntityQueryBuilder.byType<Mission>('Mission')(state);
		const stuckMissions = missions.filter(m => {
			if (m.state !== 'InProgress') return false;
			const endsAtMs = m.timers['endsAt'];
			if (!endsAtMs) return false;
			return now >= endsAtMs;
		});
		
		if (stuckMissions.length === 0) {
			return;
		}
		
		// Complete each stuck mission using ResolveMissionAction
		// Process all stuck missions in one idle loop pass
		try {
			// Use the idle loop to resolve missions
			const idleLoop = new IdleLoop();
			const result = idleLoop.processIdleProgression(state, Timestamp.from(now));
			
			if (result.newState !== state) {
				runtime.busManager.setState(result.newState);
				// Publish events
				for (const event of result.events) {
					runtime.busManager.domainEventBus.publish(event);
				}
			}
		} catch {
			// Error handling without console logging
		}
	}
</script>

<div class="dev-tools">
	<button class="dev-tools-toggle" onclick={() => (showDevTools = !showDevTools)}>
		🔧 Dev
	</button>

	{#if showDevTools}
		<div class="dev-tools-panel">
			<h3>Dev Tools</h3>
			<button class="dev-button" onclick={resetGameState}>
				🔄 Reset Game State
			</button>
			<button class="dev-button" onclick={() => (showDebugInfo = !showDebugInfo)}>
				🐛 {showDebugInfo ? 'Hide' : 'Show'} Debug Info
			</button>
			<button class="dev-button" onclick={logMissionState}>
				📋 Log Mission State to Console
			</button>
			<button class="dev-button" onclick={triggerTick}>
				⏱️ Trigger Tick (Test Completion)
			</button>
			<button class="dev-button" onclick={completeStuckMissions}>
				🔧 Complete Stuck Missions
			</button>

			{#if showDebugInfo}
				<div class="debug-info">
					<h4>Mission Status</h4>
					<div class="debug-stats">
						<div>Total: {String($missions.length)}</div>
						<div>In Progress: {String($missions.filter(m => m.state === 'InProgress').length)}</div>
						<div>Completed: {String($missions.filter(m => m.state === 'Completed').length)}</div>
					</div>
					<div class="debug-missions">
						{#each $missions as mission}
							{@const startedAtMs = mission.timers['startedAt']}
							{@const missionName = (mission.metadata.name as string) || `Mission ${String(mission.id)}`}
							{@const durationMs = mission.attributes.baseDuration.toMilliseconds()}
							{@const duration = Math.floor(durationMs / 1000)}
							{@const elapsed = startedAtMs ? Math.floor((Date.now() - startedAtMs) / 1000) : 0}
							<div class="debug-mission">
								<strong>{missionName}</strong> ({String(mission.id)})
								<br />
								Status: <span class="status-{mission.state.toLowerCase()}">{mission.state}</span>
								<br />
								Elapsed: {String(elapsed)}s / {String(duration)}s
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.dev-tools {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 1000;
	}

	.dev-tools-toggle {
		background: #ff6b6b;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: bold;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.dev-tools-toggle:hover {
		background: #ff5252;
	}

	.dev-tools-panel {
		position: absolute;
		bottom: 100%;
		right: 0;
		margin-bottom: 0.5rem;
		background: white;
		border: 2px solid #ff6b6b;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		min-width: 200px;
	}

	.dev-tools-panel h3 {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: #333;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.5rem;
	}

	.dev-button {
		width: 100%;
		background: #ff6b6b;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.75rem;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
	}

	.dev-button:hover {
		background: #ff5252;
	}

	.dev-button:last-child {
		margin-bottom: 0;
	}

	.debug-info {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.debug-info h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.9rem;
		color: #333;
	}

	.debug-stats {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}

	.debug-missions {
		max-height: 200px;
		overflow-y: auto;
		font-size: 0.8rem;
	}

	.debug-mission {
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		background: #f5f5f5;
		border-radius: 4px;
		border-left: 3px solid #ddd;
	}

	.debug-mission strong {
		display: block;
		margin-bottom: 0.25rem;
	}

	.status-inProgress {
		color: #ff9800;
		font-weight: bold;
	}

	.status-completed {
		color: #4caf50;
		font-weight: bold;
	}
</style>

