/**
 * RecruitAdventurer command handler - Uses Actions/Entities system
 * Creates new Adventurer entity and adds to GameState
 */

import type { CommandHandler, CommandHandlerContext } from '../bus/CommandBus';
import type { RecruitAdventurerCommand, DomainEvent } from '../bus/types';
import { validateCommand } from '../bus/commandValidation';
import { GameState } from '../domain/entities/GameState';
import { Adventurer } from '../domain/entities/Adventurer';
import { Identifier } from '../domain/valueObjects/Identifier';
import { NumericStatMap } from '../domain/valueObjects/NumericStatMap';
import { ResourceBundle } from '../domain/valueObjects/ResourceBundle';
import { ResourceUnit } from '../domain/valueObjects/ResourceUnit';
import type { AdventurerAttributes } from '../domain/attributes/AdventurerAttributes';
import { deriveRoleKey } from '../domain/attributes/RoleKey';
import {
	getRandomPathfinderClassKey,
	getRandomPathfinderAncestryKey
} from '../domain/data/pathfinder';
import { GameConfig } from '../domain/config/GameConfig';
import { generateAdventurerName } from '../domain/systems/adventurerNameGenerator';
import { canRecruit, getMaxRosterCapacity, getCurrentRosterSize } from '../domain/queries/RosterQueries';

/**
 * Create RecruitAdventurer command handler
 */
export function createRecruitAdventurerHandler(): CommandHandler<RecruitAdventurerCommand, GameState> {
	return function(
		payload: RecruitAdventurerCommand,
		state: GameState,
		_context: CommandHandlerContext
	): Promise<{ newState: GameState; events: DomainEvent[] }> {
		// Validate command payload using Zod
		const validation = validateCommand('RecruitAdventurer', payload);
		if (!validation.success) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RecruitAdventurer',
							reason: validation.error
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		const validatedPayload = validation.data as RecruitAdventurerCommand;

		// Validation: Check if player has enough gold
		const recruitCost = GameConfig.costs.recruitAdventurer;
		const currentGold = state.resources.get('gold') || 0;
		if (currentGold < recruitCost) {
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RecruitAdventurer',
							reason: `Insufficient gold: need ${String(recruitCost)}, have ${String(currentGold)}`
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		// Validation: Check if roster has capacity
		if (!canRecruit(state)) {
			const maxCapacity = getMaxRosterCapacity(state);
			const currentSize = getCurrentRosterSize(state);
			return Promise.resolve({
				newState: state,
				events: [
					{
						type: 'CommandFailed',
						payload: {
							commandType: 'RecruitAdventurer',
							reason: `Roster is full: capacity ${String(maxCapacity)}, current size ${String(currentSize)}. Build or upgrade Dormitory to increase capacity.`
						},
						timestamp: new Date().toISOString()
					}
				]
			});
		}

		// Generate adventurer ID
		const adventurerId = crypto.randomUUID();
		const id = Identifier.from<'AdventurerId'>(adventurerId);

		// Auto-generate name if not provided
		const adventurerName = payload.name?.trim() || generateAdventurerName(adventurerId);

		// Create new entities map (will be updated below)
		const newEntities = new Map(state.entities);

		// Determine attributes: use preview if provided, otherwise generate random
		let attributes: AdventurerAttributes;
		let traits: string[];

		if (payload.previewAdventurerId) {
			// Use preview adventurer's attributes
			const previewAdventurer = state.entities.get(payload.previewAdventurerId) as Adventurer | undefined;
			
			if (!previewAdventurer || previewAdventurer.state !== 'Preview') {
				return Promise.resolve({
					newState: state,
					events: [
						{
							type: 'CommandFailed',
							payload: {
								commandType: 'RecruitAdventurer',
								reason: `Preview adventurer ${validatedPayload.previewAdventurerId ?? 'unknown'} not found or invalid`
							},
							timestamp: new Date().toISOString()
						}
					]
				});
			}

			// Copy attributes from preview
			attributes = {
				level: previewAdventurer.attributes.level,
				xp: previewAdventurer.attributes.xp,
				abilityMods: previewAdventurer.attributes.abilityMods,
				classKey: previewAdventurer.attributes.classKey,
				ancestryKey: previewAdventurer.attributes.ancestryKey,
				traitTags: validatedPayload.traits.length > 0 ? validatedPayload.traits : previewAdventurer.attributes.traitTags,
				roleKey: previewAdventurer.attributes.roleKey,
				baseHP: previewAdventurer.attributes.baseHP,
				assignedSlotId: null
			};
			traits = validatedPayload.traits.length > 0 ? validatedPayload.traits : [...previewAdventurer.tags];

			// Remove preview entity from entities map
			if (validatedPayload.previewAdventurerId) {
				newEntities.delete(validatedPayload.previewAdventurerId);
			}
		} else {
			// Generate random attributes (backward compatible)
			const classKey = getRandomPathfinderClassKey();
			const ancestryKey = getRandomPathfinderAncestryKey();
			attributes = {
				level: 1,
				xp: 0,
				abilityMods: NumericStatMap.fromMap(new Map([
					['str', 0],
					['dex', 0],
					['con', 0],
					['int', 0],
					['wis', 0],
					['cha', 0]
				])),
				classKey,
				ancestryKey,
				traitTags: validatedPayload.traits, // Guaranteed to be array after Zod validation (default: [])
				roleKey: deriveRoleKey(classKey),
				baseHP: 10,
				assignedSlotId: null
			};
			traits = validatedPayload.traits; // Guaranteed to be array after Zod validation (default: [])
		}

		// Create new Adventurer entity
		const adventurer = new Adventurer(
			id,
			attributes,
			traits,
			'Idle', // Initial state
			{}, // No timers initially (Record, not Map)
			{ name: adventurerName } // Store name in metadata
		);

		// Add adventurer to entities map
		newEntities.set(adventurer.id, adventurer);

		// Deduct recruitment cost from resources
		const costBundle = ResourceBundle.fromArray([new ResourceUnit('gold', GameConfig.costs.recruitAdventurer)]);
		const newResources = state.resources.subtract(costBundle);

		// Create new GameState
		const newState = new GameState(
			state.playerId,
			state.lastPlayed,
			newEntities,
			newResources
		);

		// Emit AdventurerRecruited event
		const adventurerRecruitedEvent: DomainEvent = {
			type: 'AdventurerRecruited',
			payload: {
				adventurerId,
				name: adventurerName,
				traits: validatedPayload.traits // Guaranteed to be array after Zod validation (default: [])
			},
			timestamp: new Date().toISOString()
		};

		return Promise.resolve({
			newState,
			events: [adventurerRecruitedEvent]
		});
	};
}

