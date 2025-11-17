<script lang="ts">
	import { getContext } from 'svelte';
	import { missions } from '$lib/stores/gameState';
	import type { GameRuntime } from '$lib/runtime/startGame';
	import { GAME_RUNTIME_KEY } from '$lib/runtime/constants';

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
				const beforeClear = localStorage.getItem('idlefinder_state');
				localStorage.removeItem('idlefinder_state');
				const afterClear = localStorage.getItem('idlefinder_state');
				
				console.log('=== Reset Game State ===');
				console.log('Before clear:', beforeClear ? 'Data exists' : 'No data');
				console.log('After clear:', afterClear ? 'STILL EXISTS (ERROR!)' : 'Cleared ✓');
				
				if (afterClear) {
					console.error('ERROR: localStorage.removeItem did not work! Trying localStorage.clear()...');
					localStorage.clear();
					const afterClearAll = localStorage.getItem('idlefinder_state');
					console.log('After clearAll:', afterClearAll ? 'STILL EXISTS (CRITICAL ERROR!)' : 'Cleared ✓');
					
					if (afterClearAll) {
						alert('ERROR: Could not clear localStorage. Please clear it manually:\n1. Open DevTools (F12)\n2. Go to Application tab\n3. Find Local Storage\n4. Delete idlefinder_state\n5. Reload page');
						return;
					}
				}
				
				// Step 2: Also try clearing via persistence bus if available
				try {
					runtime.busManager.persistenceBus.clear();
					console.log('✓ Cleared via PersistenceBus');
				} catch {
					console.log('PersistenceBus not available (this is OK)');
				}
				
				// Step 3: Verify it's actually gone
				const finalCheck = localStorage.getItem('idlefinder_state');
				if (finalCheck) {
					console.error('CRITICAL: Data still exists after all clear attempts!');
					alert('Could not clear save data. Please use browser DevTools to manually delete it.');
					return;
				}
				
				console.log('✓ All clear! Reloading page...');
				
				// Step 4: Force hard reload (bypass cache)
				// Use location.reload(true) for hard reload, or location.href for navigation
				setTimeout(() => {
					// Set a flag in sessionStorage to prevent auto-save during reload
					sessionStorage.setItem('__resetting', 'true');
					
					// Force hard reload
					if (window.location.reload) {
						window.location.reload(true);
					} else {
						// Fallback for browsers that don't support reload(true)
						window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
					}
				}, 100);
			} catch (error) {
				console.error('Failed to reset game state:', error);
				alert('Error during reset. Please manually clear localStorage:\nlocalStorage.removeItem("idlefinder_state")');
			}
		}
	}

	function logMissionState() {
		const state = runtime.busManager.getState();
		const missions = Array.from(state.entities.values()).filter(e => e.type === 'Mission') as import('$lib/domain/entities/Mission').Mission[];
		
		console.log('=== Mission State Debug ===');
		console.log('Total missions:', missions.length);
		console.log('In Progress:', missions.filter(m => m.state === 'InProgress').length);
		console.log('Completed:', missions.filter(m => m.state === 'Completed').length);
		console.log('\n--- All Missions ---');
		
		const now = Date.now();
		missions.forEach((m, index) => {
			const startedAt = m.timers.get('startedAt');
			const endsAt = m.timers.get('endsAt');
			const missionName = (m.metadata.name as string) || `Mission ${m.id}`;
			const duration = m.attributes.baseDuration.toMilliseconds();
			const elapsed = startedAt ? now - startedAt.value : 0;
			const shouldBeComplete = endsAt ? now >= endsAt.value : false;
			const progress = startedAt && endsAt ? Math.min(100, ((now - startedAt.value) / (endsAt.value - startedAt.value)) * 100) : 0;
			
			console.log(`\nMission ${index + 1}:`);
			console.log(`  ID: ${m.id}`);
			console.log(`  Name: ${missionName}`);
			console.log(`  Status: ${m.state}`);
			console.log(`  Started At: ${startedAt ? new Date(startedAt.value).toISOString() : 'N/A'}`);
			console.log(`  Ends At: ${endsAt ? new Date(endsAt.value).toISOString() : 'N/A'}`);
			console.log(`  Duration: ${duration}ms (${Math.floor(duration / 1000)}s)`);
			console.log(`  Elapsed: ${elapsed}ms (${Math.floor(elapsed / 1000)}s)`);
			console.log(`  Progress: ${progress.toFixed(1)}%`);
			console.log(`  Should be complete: ${shouldBeComplete}`);
			if (m.state === 'InProgress' && shouldBeComplete) {
				console.log(`  ⚠️ ISSUE: Mission is InProgress but should be completed!`);
			}
		});
		
		console.log('\n--- Tick Handler Status ---');
		const tickBus = runtime.busManager.tickBus;
		console.log('Tick handlers registered:', (tickBus as any).handlers?.size || 'unknown');
		
		console.log('\n========================');
	}

	async function triggerTick() {
		const tickBus = runtime.busManager.tickBus;
		const now = new Date();
		
		console.log('=== Triggering Manual Tick ===');
		console.log('Timestamp:', now.toISOString());
		
		// Access the private emitTick method via any cast
		// This is a dev tool, so it's okay to access internals
		try {
			// Get all tick handlers
			const handlers = (tickBus as any).handlers;
			if (handlers && handlers.size > 0) {
				console.log(`Running ${handlers.size} tick handler(s)...`);
				for (const handler of handlers) {
					await handler(1000, now); // 1 second delta
				}
				console.log('Tick handlers completed');
				
				// Log state after tick
				const state = runtime.busManager.getState();
				const missions = Array.from(state.entities.values()).filter(e => e.type === 'Mission') as import('$lib/domain/entities/Mission').Mission[];
				const inProgress = missions.filter(m => m.state === 'InProgress').length;
				const completed = missions.filter(m => m.state === 'Completed').length;
				console.log(`After tick - In Progress: ${inProgress}, Completed: ${completed}`);
			} else {
				console.warn('No tick handlers registered!');
			}
		} catch (error) {
			console.error('Error triggering tick:', error);
		}
	}

	async function completeStuckMissions() {
		const state = runtime.busManager.getState();
		const now = Date.now();
		
		console.log('=== Completing Stuck Missions ===');
		
		const missions = Array.from(state.entities.values()).filter(e => e.type === 'Mission') as import('$lib/domain/entities/Mission').Mission[];
		const stuckMissions = missions.filter(m => {
			if (m.state !== 'InProgress') return false;
			const endsAt = m.timers.get('endsAt');
			if (!endsAt) return false;
			return now >= endsAt.value;
		});
		
		if (stuckMissions.length === 0) {
			console.log('No stuck missions found');
			return;
		}
		
		console.log(`Found ${stuckMissions.length} stuck mission(s):`, stuckMissions.map(m => ({
			id: m.id,
			name: (m.metadata.name as string) || m.id,
			endsAt: m.timers.get('endsAt')?.value || 0
		})));
		
		// Complete each stuck mission using ResolveMissionAction
		let completed = 0;
		for (const mission of stuckMissions) {
			try {
				// Use the idle loop to resolve missions
				const { Timestamp } = await import('$lib/domain/valueObjects/Timestamp');
				const idleLoop = new (await import('$lib/domain/systems/IdleLoop')).IdleLoop();
				const result = idleLoop.processIdleProgression(state, Timestamp.from(now));
				
				if (result.newState !== state) {
					runtime.busManager.setState(result.newState);
					// Publish events
					for (const event of result.events) {
						await runtime.busManager.domainEventBus.publish(event);
					}
					completed++;
				}
			} catch (error) {
				console.error(`✗ Failed to complete ${mission.id}:`, error);
			}
		}
		
		console.log(`Completed ${completed} mission(s)`);
		console.log('========================');
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
						<div>Total: {$missions.length}</div>
						<div>In Progress: {$missions.filter(m => m.state === 'InProgress').length}</div>
						<div>Completed: {$missions.filter(m => m.state === 'Completed').length}</div>
					</div>
					<div class="debug-missions">
						{#each $missions as mission}
							{@const startedAt = mission.timers.get('startedAt')}
							{@const missionName = (mission.metadata.name as string) || `Mission ${mission.id}`}
							{@const duration = mission.attributes.baseDuration.toMilliseconds()}
							{@const elapsed = startedAt ? Math.floor((Date.now() - startedAt.value) / 1000) : 0}
							<div class="debug-mission">
								<strong>{missionName}</strong> ({mission.id})
								<br />
								Status: <span class="status-{mission.state.toLowerCase()}">{mission.state}</span>
								<br />
								Elapsed: {elapsed}s / {Math.floor(duration / 1000)}s
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

