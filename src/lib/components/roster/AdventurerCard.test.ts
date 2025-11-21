// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import AdventurerCard from './AdventurerCard.svelte';
import { createTestAdventurer } from '../../test-utils/testFactories';

describe('AdventurerCard', () => {
	it('should display "Available" badge when adventurer is Idle', () => {
		const adventurer = createTestAdventurer({ 
			id: 'adv-1', 
			state: 'Idle',
			name: 'Bob'
		});
		
		render(AdventurerCard, { adventurer });
		
		const badge = screen.getByText('Available');
		expect(badge).toBeInTheDocument();
	});

	it('should display "On Mission" badge when adventurer is OnMission', () => {
		const adventurer = createTestAdventurer({ 
			id: 'adv-1', 
			state: 'OnMission',
			name: 'Bob'
		});
		
		render(AdventurerCard, { adventurer });
		
		const badge = screen.getByText('On Mission');
		expect(badge).toBeInTheDocument();
	});

	it('should display adventurer name', () => {
		const adventurer = createTestAdventurer({ 
			id: 'adv-1', 
			name: 'Tim',
			state: 'Idle'
		});
		
		render(AdventurerCard, { adventurer });
		
		const name = screen.getByText('Tim');
		expect(name).toBeInTheDocument();
	});

	it('should display adventurer level', () => {
		const adventurer = createTestAdventurer({ 
			id: 'adv-1', 
			level: 5,
			state: 'Idle'
		});
		
		render(AdventurerCard, { adventurer });
		
		const level = screen.getByText('Level 5');
		expect(level).toBeInTheDocument();
	});
});

