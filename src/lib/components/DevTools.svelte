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
		const now = Date.now();
		
		console.log('=== Mission State Debug ===');
		console.log('Total missions:', state.missions.length);
		console.log('In Progress:', state.missions.filter(m => m.status === 'inProgress').length);
		console.log('Completed:', state.missions.filter(m => m.status === 'completed').length);
		console.log('\n--- All Missions ---');
		
		state.missions.forEach((m, index) => {
			const startTime = new Date(m.startTime).getTime();
			const elapsed = now - startTime;
			const shouldBeComplete = elapsed >= m.duration;
			const progress = Math.min(100, (elapsed / m.duration) * 100);
			
			console.log(`\nMission ${index + 1}:`);
			console.log(`  ID: ${m.id}`);
			console.log(`  Name: ${m.name}`);
			console.log(`  Status: ${m.status}`);
			console.log(`  Start Time: ${m.startTime}`);
			console.log(`  Duration: ${m.duration}ms (${Math.floor(m.duration / 1000)}s)`);
			console.log(`  Elapsed: ${elapsed}ms (${Math.floor(elapsed / 1000)}s)`);
			console.log(`  Progress: ${progress.toFixed(1)}%`);
			console.log(`  Should be complete: ${shouldBeComplete}`);
			if (m.status === 'inProgress' && shouldBeComplete) {
				console.log(`  ⚠️ ISSUE: Mission is inProgress but should be completed!`);
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
				const inProgress = state.missions.filter(m => m.status === 'inProgress').length;
				const completed = state.missions.filter(m => m.status === 'completed').length;
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
		
		const stuckMissions = state.missions.filter(m => {
			if (m.status !== 'inProgress') return false;
			const startTime = new Date(m.startTime).getTime();
			const elapsed = now - startTime;
			return elapsed >= m.duration;
		});
		
		if (stuckMissions.length === 0) {
			console.log('No stuck missions found');
			return;
		}
		
		console.log(`Found ${stuckMissions.length} stuck mission(s):`, stuckMissions.map(m => ({
			id: m.id,
			name: m.name,
			elapsed: Math.floor((now - new Date(m.startTime).getTime()) / 1000),
			duration: Math.floor(m.duration / 1000)
		})));
		
		// Complete each stuck mission
		// Note: We need to complete them one at a time and check state after each,
		// because missions with duplicate IDs will cause the handler to find the wrong one
		let completed = 0;
		let attempts = 0;
		const maxAttempts = stuckMissions.length * 2; // Allow retries for duplicate IDs
		
		while (attempts < maxAttempts) {
			const currentState = runtime.busManager.getState();
			const stillStuck = currentState.missions.filter(m => {
				if (m.status !== 'inProgress') return false;
				const startTime = new Date(m.startTime).getTime();
				const elapsed = now - startTime;
				return elapsed >= m.duration;
			});
			
			if (stillStuck.length === 0) {
				console.log('All stuck missions completed!');
				break;
			}
			
			// Try to complete the first stuck mission
			const missionToComplete = stillStuck[0];
			try {
				console.log(`Attempting to complete mission ${missionToComplete.id} (${missionToComplete.name})...`);
				await runtime.busManager.commandBus.dispatch({
					type: 'CompleteMission',
					payload: { missionId: missionToComplete.id },
					timestamp: new Date().toISOString()
				});
				
				// Check if it was actually completed
				const afterState = runtime.busManager.getState();
				const missionAfter = afterState.missions.find(m => m.id === missionToComplete.id);
				if (missionAfter && missionAfter.status === 'completed') {
					console.log(`✓ Completed ${missionToComplete.id}`);
					completed++;
				} else {
					console.log(`⚠ Mission ${missionToComplete.id} still in progress (may have duplicate ID)`);
					// If this mission has a duplicate ID, try to complete by finding all instances
					const allWithSameId = afterState.missions.filter(m => m.id === missionToComplete.id && m.status === 'inProgress');
					if (allWithSameId.length > 0) {
						console.log(`Found ${allWithSameId.length} mission(s) with duplicate ID ${missionToComplete.id} still in progress`);
						// Complete each duplicate mission instance individually by dispatching for each one
						// We'll use the mission's index or a combination of ID + startTime to identify it uniquely
						for (const duplicateMission of allWithSameId) {
							// Try to complete this specific instance by using a workaround:
							// Complete all missions with this ID, then the handler's map() will update all of them
							// Actually, the handler uses map() which updates ALL missions with that ID, so we need a different approach
							// Let's manually complete each one by directly calling the handler logic
							try {
								// Import CompleteMissionHandler logic (simplified version for dev tool)
								const mission = duplicateMission;
								const updatedMissions = afterState.missions.map(m => 
									m.id === mission.id && m.status === 'inProgress' && m.startTime === mission.startTime
										? { ...m, status: 'completed' as const }
										: m
								);
								
								// Free adventurers
								let updatedState = { ...afterState, missions: updatedMissions };
								for (const adventurerId of mission.assignedAdventurerIds) {
									updatedState = {
										...updatedState,
										adventurers: updatedState.adventurers.map((adv) =>
											adv.id === adventurerId
												? { ...adv, status: 'idle' as const, assignedMissionId: null }
												: adv
										)
									};
								}
								
								// Apply rewards
								updatedState = {
									...updatedState,
									resources: {
										gold: updatedState.resources.gold + mission.reward.resources.gold,
										supplies: updatedState.resources.supplies + mission.reward.resources.supplies,
										relics: updatedState.resources.relics + mission.reward.resources.relics
									},
									fame: updatedState.fame + mission.reward.fame,
									completedMissionIds: [...updatedState.completedMissionIds, mission.id]
								};
								
								runtime.busManager.setState(updatedState);
								console.log(`✓ Force-completed duplicate mission ${mission.id} (started ${mission.startTime})`);
								completed++;
							} catch (error) {
								console.error(`✗ Failed to force-complete duplicate mission:`, error);
							}
						}
					}
				}
			} catch (error) {
				console.error(`✗ Failed to complete ${missionToComplete.id}:`, error);
			}
			
			attempts++;
		}
		
		const finalState = runtime.busManager.getState();
		const stillStuckFinal = finalState.missions.filter(m => {
			if (m.status !== 'inProgress') return false;
			const startTime = new Date(m.startTime).getTime();
			const elapsed = now - startTime;
			return elapsed >= m.duration;
		});
		
		console.log(`Completed ${completed} mission(s), ${stillStuckFinal.length} still stuck`);
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
						<div>In Progress: {$missions.filter(m => m.status === 'inProgress').length}</div>
						<div>Completed: {$missions.filter(m => m.status === 'completed').length}</div>
					</div>
					<div class="debug-missions">
						{#each $missions as mission}
							<div class="debug-mission">
								<strong>{mission.name}</strong> ({mission.id})
								<br />
								Status: <span class="status-{mission.status}">{mission.status}</span>
								<br />
								Elapsed: {Math.floor((Date.now() - new Date(mission.startTime).getTime()) / 1000)}s / {Math.floor(mission.duration / 1000)}s
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

