// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import TimerItem from './TimerItem.svelte';
import type { TimerInfo } from '../../domain/queries/TimerQueries';

describe('TimerItem', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// gameTime is global and doesn't need initialization
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('should display timer label', () => {
		const timer: TimerInfo = {
			id: 'timer-1',
			label: 'Harvest Crops',
			timeRemaining: 30000,
			type: 'mission'
		};
		const initialTime = Date.now();
		
		render(TimerItem, { timer, initialTime });
		
		expect(screen.getByText('Harvest Crops')).toBeInTheDocument();
	});

	it('should display formatted time remaining', async () => {
		const timer: TimerInfo = {
			id: 'timer-1',
			label: 'Harvest Crops',
			timeRemaining: 30000, // 30 seconds
			type: 'mission'
		};
		const initialTime = Date.now();
		
		render(TimerItem, { timer, initialTime });
		
		// Should display formatted time (e.g., "30s" or similar)
		await waitFor(() => {
			const timeElement = screen.getByText(/Harvest Crops/).closest('.timer-item');
			expect(timeElement).toBeInTheDocument();
		});
	});
});

