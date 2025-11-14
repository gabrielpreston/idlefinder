/**
 * Starts a visual tick loop for smooth UI updates.
 * Uses requestAnimationFrame for smooth animation.
 * Throttles updates to specified interval to avoid excessive updates.
 * 
 * @param updateFn Function to call on each tick
 * @param interval Minimum time between updates in milliseconds (default: 100ms)
 * @returns Cleanup function to stop the tick loop
 */
export function startVisualTick(
	updateFn: () => void,
	interval: number = 100
): () => void {
	let animationFrameId: number | null = null;
	let lastUpdate = Date.now();

	function tick(): void {
		const now = Date.now();
		if (now - lastUpdate >= interval) {
			updateFn();
			lastUpdate = now;
		}
		animationFrameId = requestAnimationFrame(tick);
	}

	animationFrameId = requestAnimationFrame(tick);

	return () => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	};
}

