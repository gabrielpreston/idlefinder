// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import TimerList from './TimerList.svelte';
import type { TimerInfo } from '../../domain/queries/TimerQueries';

describe('TimerList', () => {
	beforeEach(() => {
		// No store initialization needed - TimerList takes timers as prop
		// gameTime is global and doesn't need initialization
	});

	afterEach(() => {
		cleanup();
	});

	it('should display empty state when no timers', () => {
		render(TimerList, { timers: [] });
		expect(screen.getByText('No active timers')).toBeInTheDocument();
	});

	it('should display timer items when timers are provided', () => {
		const timers: TimerInfo[] = [
			{
				id: 'timer-1',
				label: 'Harvest Crops',
				timeRemaining: 17000,
				type: 'mission'
			}
		];
		
		render(TimerList, { timers });
		
		expect(screen.getByText('Harvest Crops')).toBeInTheDocument();
	});

	it('should limit display to 10 timers', () => {
		const timers: TimerInfo[] = Array.from({ length: 15 }, (_, i) => ({
			id: `timer-${String(i)}`,
			label: `Timer ${String(i)}`,
			timeRemaining: 60000,
			type: 'mission' as const
		}));
		
		render(TimerList, { timers });
		
		// Should only show first 10
		expect(screen.getByText('Timer 0')).toBeInTheDocument();
		expect(screen.getByText('Timer 9')).toBeInTheDocument();
		expect(screen.queryByText('Timer 10')).not.toBeInTheDocument();
	});
});

