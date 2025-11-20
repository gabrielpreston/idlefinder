/**
 * UI Gating Queries Tests - UI panel unlock status queries
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	PANEL_IDS,
	isAdventurersPanelUnlocked,
	isMissionsPanelUnlocked,
	isMissionsPanelFunctional,
	isFacilitiesPanelUnlocked,
	getPanelUnlockReason
} from './UIGatingQueries';
import { createTestGameState, createTestAdventurer } from '../../test-utils/testFactories';
import type { GameState } from '../entities/GameState';
import type { Facility } from '../entities/Facility';
import type { Entity } from '../primitives/Requirement';
// Import gating module to ensure gates are registered
import '../gating';

describe('UIGatingQueries', () => {
	let state: GameState;

	beforeEach(() => {
		state = createTestGameState();
	});

	describe('isAdventurersPanelUnlocked', () => {
		it('should return false when guildhall is tier 0', () => {
			expect(isAdventurersPanelUnlocked(state)).toBe(false);
		});

		it('should return true when guildhall reaches tier 1', () => {
			const guildhall = Array.from(state.entities.values()).find(
				e => e.type === 'Facility' && (e as import('../entities/Facility').Facility).attributes.facilityType === 'Guildhall'
			) as import('../entities/Facility').Facility;
			if (guildhall) {
				guildhall.upgrade(); // Tier 0 -> 1
			}

			expect(isAdventurersPanelUnlocked(state)).toBe(true);
		});
	});

	describe('isMissionsPanelUnlocked', () => {
		it('should return false when guildhall is tier 0', () => {
			expect(isMissionsPanelUnlocked(state)).toBe(false);
		});

		it('should return true when guildhall reaches tier 1', () => {
			const guildhall = Array.from(state.entities.values()).find(
				e => e.type === 'Facility' && (e as import('../entities/Facility').Facility).attributes.facilityType === 'Guildhall'
			) as import('../entities/Facility').Facility;
			if (guildhall) {
				guildhall.upgrade(); // Tier 0 -> 1
			}

			expect(isMissionsPanelUnlocked(state)).toBe(true);
		});
	});

	describe('isMissionsPanelFunctional', () => {
		it('should return false when no adventurers exist', () => {
			expect(isMissionsPanelFunctional(state)).toBe(false);
		});

		it('should return true when at least one adventurer exists', () => {
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([[adventurer.id, adventurer]]);
			const stateWithAdventurer = createTestGameState({ entities });

			expect(isMissionsPanelFunctional(stateWithAdventurer)).toBe(true);
		});
	});

	describe('isFacilitiesPanelUnlocked', () => {
		it('should return true when Guild Hall is at Tier 0', () => {
			// Initial state has Guild Hall at Tier 0
			expect(isFacilitiesPanelUnlocked(state)).toBe(true);
		});

		it('should return true when Guild Hall is at Tier 1+', () => {
			const guildhall = Array.from(state.entities.values()).find(
				(e) => e.type === 'Facility' && (e as Facility).attributes.facilityType === 'Guildhall'
			) as Facility;
			if (guildhall) {
				guildhall.upgrade(); // Tier 0 -> 1
			}
			expect(isFacilitiesPanelUnlocked(state)).toBe(true);
		});
	});

	describe('getPanelUnlockReason', () => {
		it('should return null for always-available panels', () => {
			expect(getPanelUnlockReason(PANEL_IDS.DASHBOARD, state)).toBeNull();
		});

		it('should return unlock reason for gated panels', () => {
			// Equipment, Crafting, Doctrine are now gated
			const equipmentReason = getPanelUnlockReason(PANEL_IDS.EQUIPMENT, state);
			expect(equipmentReason).not.toBeNull();
			expect(equipmentReason).toContain('tier 2');

			const craftingReason = getPanelUnlockReason(PANEL_IDS.CRAFTING, state);
			expect(craftingReason).not.toBeNull();
			expect(craftingReason).toContain('tier 3');

			const doctrineReason = getPanelUnlockReason(PANEL_IDS.DOCTRINE, state);
			expect(doctrineReason).not.toBeNull();
			expect(doctrineReason).toContain('tier 4');
		});

		it('should return reason for locked adventurers panel', () => {
			const reason = getPanelUnlockReason(PANEL_IDS.ADVENTURERS, state);
			expect(reason).not.toBeNull();
			expect(typeof reason).toBe('string');
		});

		it('should return null for unlocked adventurers panel', () => {
			const guildhall = Array.from(state.entities.values()).find(
				e => e.type === 'Facility' && (e as import('../entities/Facility').Facility).attributes.facilityType === 'Guildhall'
			) as import('../entities/Facility').Facility;
			if (guildhall) {
				guildhall.upgrade(); // Tier 0 -> 1
			}

			const reason = getPanelUnlockReason(PANEL_IDS.ADVENTURERS, state);
			expect(reason).toBeNull();
		});

		it('should return functional reason for missions panel when unlocked but no adventurers', () => {
			const guildhall = Array.from(state.entities.values()).find(
				e => e.type === 'Facility' && (e as import('../entities/Facility').Facility).attributes.facilityType === 'Guildhall'
			) as import('../entities/Facility').Facility;
			if (guildhall) {
				guildhall.upgrade(); // Tier 0 -> 1
			}

			const reason = getPanelUnlockReason(PANEL_IDS.MISSIONS, state);
			expect(reason).toBe('Recruit your first adventurer to activate');
		});

		it('should return null for missions panel when functional', () => {
			const guildhall = Array.from(state.entities.values()).find(
				e => e.type === 'Facility' && (e as import('../entities/Facility').Facility).attributes.facilityType === 'Guildhall'
			) as import('../entities/Facility').Facility;
			if (guildhall) {
				guildhall.upgrade(); // Tier 0 -> 1
			}
			const adventurer = createTestAdventurer({ id: 'adv-1' });
			const entities = new Map<string, Entity>([
				...Array.from(state.entities.entries()),
				[adventurer.id, adventurer]
			]);
			const stateWithAdventurer = createTestGameState({ entities });

			const reason = getPanelUnlockReason(PANEL_IDS.MISSIONS, stateWithAdventurer);
			expect(reason).toBeNull();
		});

		it('should return null for unlocked facilities panel at Tier 0', () => {
			// Facilities panel is unlocked at Tier 0
			const reason = getPanelUnlockReason(PANEL_IDS.FACILITIES, state);
			expect(reason).toBeNull();
		});

		it('should return unknown panel for invalid panel ID', () => {
			const reason = getPanelUnlockReason('invalid-panel', state);
			expect(reason).toBe('Unknown panel');
		});
	});
});

