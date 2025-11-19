/**
 * Requirement Tests - Testing requirement validation logic
 */

import { describe, it, expect } from 'vitest';
import {
	allRequirements,
	anyRequirement,
	entityExistsRequirement,
	entityStateRequirement,
	adventurerIdleRequirement,
	missionAvailableRequirement,
	resourceRequirement
} from './Requirement';
import type { RequirementContext } from './Requirement';
import { ResourceBundle } from '../valueObjects/ResourceBundle';
import { ResourceUnit } from '../valueObjects/ResourceUnit';
import { Timestamp } from '../valueObjects/Timestamp';
import type { Entity } from './Requirement';

describe('Requirement', () => {
	const createContext = (entities: Map<string, Entity>, resources: ResourceBundle = new ResourceBundle(new Map())): RequirementContext => ({
		entities,
		resources,
		currentTime: Timestamp.now()
	});

	describe('allRequirements', () => {
		it('should return satisfied when all requirements pass', () => {
			const req1 = () => ({ satisfied: true });
			const req2 = () => ({ satisfied: true });
			const req3 = () => ({ satisfied: true });

			const combined = allRequirements(req1, req2, req3);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(true);
		});

		it('should return first failure when any requirement fails', () => {
			const req1 = () => ({ satisfied: true });
			const req2 = () => ({ satisfied: false, reason: 'Second failed' });
			const req3 = () => ({ satisfied: true });

			const combined = allRequirements(req1, req2, req3);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(false);
			expect(result.reason).toBe('Second failed');
		});

		it('should return first failure even if later requirements would pass', () => {
			const req1 = () => ({ satisfied: false, reason: 'First failed' });
			const req2 = () => ({ satisfied: true });
			const req3 = () => ({ satisfied: true });

			const combined = allRequirements(req1, req2, req3);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(false);
			expect(result.reason).toBe('First failed');
		});
	});

	describe('anyRequirement', () => {
		it('should return satisfied when any requirement passes', () => {
			const req1 = () => ({ satisfied: false, reason: 'First failed' });
			const req2 = () => ({ satisfied: true });
			const req3 = () => ({ satisfied: false, reason: 'Third failed' });

			const combined = anyRequirement(req1, req2, req3);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(true);
		});

		it('should return satisfied on first passing requirement', () => {
			const req1 = () => ({ satisfied: true });
			const req2 = () => ({ satisfied: false, reason: 'Second failed' });
			const req3 = () => ({ satisfied: false, reason: 'Third failed' });

			const combined = anyRequirement(req1, req2, req3);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(true);
		});

		it('should return failure with combined reasons when all requirements fail', () => {
			const req1 = () => ({ satisfied: false, reason: 'First failed' });
			const req2 = () => ({ satisfied: false, reason: 'Second failed' });
			const req3 = () => ({ satisfied: false, reason: 'Third failed' });

			const combined = anyRequirement(req1, req2, req3);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('None of the requirements were satisfied');
			expect(result.reason).toContain('First failed');
			expect(result.reason).toContain('Second failed');
			expect(result.reason).toContain('Third failed');
		});

		it('should handle requirements without reasons', () => {
			const req1 = () => ({ satisfied: false });
			const req2 = () => ({ satisfied: false, reason: 'Second failed' });

			const combined = anyRequirement(req1, req2);
			const context = createContext(new Map());

			const result = combined(context);
			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('Second failed');
		});
	});

	describe('entityExistsRequirement', () => {
		it('should pass when entity exists', () => {
			const entity: Entity = { id: 'entity-1', type: 'TestEntity' };
			const context = createContext(new Map([['entity-1', entity]]));

			const requirement = entityExistsRequirement('entity-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should fail when entity does not exist', () => {
			const context = createContext(new Map());

			const requirement = entityExistsRequirement('entity-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('does not exist');
		});

		it('should pass when entity exists and type matches', () => {
			const entity: Entity = { id: 'entity-1', type: 'TestEntity' };
			const context = createContext(new Map([['entity-1', entity]]));

			const requirement = entityExistsRequirement('entity-1', 'TestEntity');
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should fail when entity exists but type does not match', () => {
			const entity: Entity = { id: 'entity-1', type: 'TestEntity' };
			const context = createContext(new Map([['entity-1', entity]]));

			const requirement = entityExistsRequirement('entity-1', 'WrongType');
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('not of type');
			expect(result.reason).toContain('WrongType');
			expect(result.reason).toContain('TestEntity');
		});

		it('should pass when entity exists and no type specified', () => {
			const entity: Entity = { id: 'entity-1', type: 'TestEntity' };
			const context = createContext(new Map([['entity-1', entity]]));

			const requirement = entityExistsRequirement('entity-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});
	});

	describe('entityStateRequirement', () => {
		it('should pass when entity is in required state', () => {
			const entity: Entity & { state: string } = { id: 'entity-1', type: 'TestEntity', state: 'Idle' };
			const context = createContext(new Map([['entity-1', entity]]));

			const requirement = entityStateRequirement('entity-1', 'Idle');
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should fail when entity is not in required state', () => {
			const entity: Entity & { state: string } = { id: 'entity-1', type: 'TestEntity', state: 'Active' };
			const context = createContext(new Map([['entity-1', entity]]));

			const requirement = entityStateRequirement('entity-1', 'Idle');
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('not in state');
			expect(result.reason).toContain('Idle');
			expect(result.reason).toContain('Active');
		});

		it('should fail when entity does not exist', () => {
			const context = createContext(new Map());

			const requirement = entityStateRequirement('entity-1', 'Idle');
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('does not exist');
		});
	});

	describe('adventurerIdleRequirement', () => {
		it('should pass when adventurer is idle', () => {
			const entity: Entity & { state: string } = { id: 'adv-1', type: 'Adventurer', state: 'Idle' };
			const context = createContext(new Map([['adv-1', entity]]));

			const requirement = adventurerIdleRequirement('adv-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should fail when adventurer is not idle', () => {
			const entity: Entity & { state: string } = { id: 'adv-1', type: 'Adventurer', state: 'OnMission' };
			const context = createContext(new Map([['adv-1', entity]]));

			const requirement = adventurerIdleRequirement('adv-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
		});
	});

	describe('missionAvailableRequirement', () => {
		it('should pass when mission is available', () => {
			const entity: Entity & { state: string } = { id: 'mission-1', type: 'Mission', state: 'Available' };
			const context = createContext(new Map([['mission-1', entity]]));

			const requirement = missionAvailableRequirement('mission-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should fail when mission is not available', () => {
			const entity: Entity & { state: string } = { id: 'mission-1', type: 'Mission', state: 'InProgress' };
			const context = createContext(new Map([['mission-1', entity]]));

			const requirement = missionAvailableRequirement('mission-1');
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
		});
	});

	describe('resourceRequirement', () => {
		it('should pass when resource amount is sufficient', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100)
			]);
			const context = createContext(new Map(), resources);

			const requirement = resourceRequirement('gold', 50);
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should pass when resource amount equals minimum', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 100)
			]);
			const context = createContext(new Map(), resources);

			const requirement = resourceRequirement('gold', 100);
			const result = requirement(context);

			expect(result.satisfied).toBe(true);
		});

		it('should fail when resource amount is insufficient', () => {
			const resources = ResourceBundle.fromArray([
				new ResourceUnit('gold', 50)
			]);
			const context = createContext(new Map(), resources);

			const requirement = resourceRequirement('gold', 100);
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('Insufficient');
			expect(result.reason).toContain('gold');
			expect(result.reason).toContain('50');
			expect(result.reason).toContain('100');
		});

		it('should fail when resource does not exist', () => {
			const resources = new ResourceBundle(new Map());
			const context = createContext(new Map(), resources);

			const requirement = resourceRequirement('gold', 100);
			const result = requirement(context);

			expect(result.satisfied).toBe(false);
			expect(result.reason).toContain('Insufficient');
		});
	});
});

