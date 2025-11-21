// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import AdventurerGrid from './AdventurerGrid.svelte';
import { createTestAdventurer } from '../../test-utils/testFactories';

describe('AdventurerGrid', () => {
	it('should display multiple adventurers', () => {
		const bob = createTestAdventurer({ id: 'adv-1', name: 'Bob', state: 'Idle' });
		const tim = createTestAdventurer({ id: 'adv-2', name: 'Tim', state: 'Idle' });
		
		render(AdventurerGrid, { 
			adventurers: [bob, tim],
			filters: { state: 'all', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.getByText('Tim')).toBeInTheDocument();
	});

	it('should filter by state', () => {
		const bob = createTestAdventurer({ id: 'adv-1', name: 'Bob', state: 'OnMission' });
		const tim = createTestAdventurer({ id: 'adv-2', name: 'Tim', state: 'Idle' });
		
		render(AdventurerGrid, { 
			adventurers: [bob, tim],
			filters: { state: 'Idle', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		expect(screen.queryByText('Bob')).not.toBeInTheDocument();
		expect(screen.getByText('Tim')).toBeInTheDocument();
	});

	it('should show empty state when no adventurers match filters', () => {
		const bob = createTestAdventurer({ id: 'adv-1', name: 'Bob', state: 'OnMission' });
		
		render(AdventurerGrid, { 
			adventurers: [bob],
			filters: { state: 'Idle', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		expect(screen.getByText(/No adventurers match/i)).toBeInTheDocument();
	});

	it('should display both Idle and OnMission adventurers when filter is "all"', () => {
		const bob = createTestAdventurer({ id: 'adv-1', name: 'Bob', state: 'OnMission' });
		const tim = createTestAdventurer({ id: 'adv-2', name: 'Tim', state: 'Idle' });
		
		render(AdventurerGrid, { 
			adventurers: [bob, tim],
			filters: { state: 'all', role: 'all', search: '' },
			sortBy: 'level'
		});
		
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.getByText('Tim')).toBeInTheDocument();
		expect(screen.getByText('On Mission')).toBeInTheDocument();
		expect(screen.getByText('Available')).toBeInTheDocument();
	});
});

