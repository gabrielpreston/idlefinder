// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte/svelte5';
import '@testing-library/jest-dom/vitest';
import ResourceStockpilesDisplay from './ResourceStockpilesDisplay.svelte';
import { createTestGameState, createTestResourceBundle } from '../../test-utils/testFactories';
import { startGame } from '../../runtime/startGame';
import { SimulatedTimeSource } from '../../time/DomainTimeSource';
import { Timestamp } from '../../domain/valueObjects/Timestamp';
import { gameState } from '../../stores/gameState';

describe('ResourceStockpilesDisplay', () => {
	beforeEach(() => {
		const state = createTestGameState();
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
	});

	afterEach(() => {
		cleanup();
	});

	it('should display "Stockpiles" heading', () => {
		render(ResourceStockpilesDisplay);
		expect(screen.getByText('Stockpiles')).toBeInTheDocument();
	});

	it('should display gold, fame, and materials labels', async () => {
		render(ResourceStockpilesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('Gold')).toBeInTheDocument();
			expect(screen.getByText('Fame')).toBeInTheDocument();
			expect(screen.getByText('Materials')).toBeInTheDocument();
		});
	});

	it('should display correct resource values from stores', async () => {
		const state = createTestGameState({
			resources: createTestResourceBundle({ gold: 550, fame: 10, materials: 2 })
		});
		
		const runtime = startGame(state, new SimulatedTimeSource(Timestamp.now()));
		gameState.initialize(runtime);
		
		render(ResourceStockpilesDisplay);
		
		await waitFor(() => {
			expect(screen.getByText('550')).toBeInTheDocument();
			expect(screen.getByText('10')).toBeInTheDocument();
			expect(screen.getByText('2')).toBeInTheDocument();
		});
	});
});

