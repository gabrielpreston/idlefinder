import { describe, it, expect } from 'vitest';
import { ProgressionSystem } from './ProgressionSystem';
import { Organization } from '../entities/Organization';
import { Identifier } from '../valueObjects/Identifier';
import { Timestamp } from '../valueObjects/Timestamp';
import { ResourceBundle, ResourceUnit } from '../valueObjects';
import { ProgressTrack } from '../entities/ProgressTrack';
import { UnlockRule } from '../entities/UnlockRule';
import type { OrganizationId, PlayerId } from '../valueObjects/Identifier';

describe('ProgressionSystem', () => {
	const createOrganization = (): Organization => {
		const orgId: OrganizationId = Identifier.generate();
		const playerId: PlayerId = Identifier.generate();
		const createdAt = Timestamp.now();
		const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', 100)]);
		return new Organization(
			orgId,
			playerId,
			createdAt,
			createdAt,
			new Map(),
			{ wallet },
			createdAt
		);
	};

	const system = new ProgressionSystem();

	describe('incrementTrack', () => {
		it('should increment existing track', () => {
			const org = createOrganization();
			const trackId = Identifier.generate();
			const track = new ProgressTrack(trackId, org.id, 'exploration', 50);
			org.progressTracks.set('exploration', track);

			system.incrementTrack(org, 'exploration', 25);
			expect(track.currentValue).toBe(75);
		});

		it('should create track if it does not exist', () => {
			const org = createOrganization();
			system.incrementTrack(org, 'exploration', 100);
			const track = org.getProgressTrack('exploration');
			expect(track).toBeDefined();
			expect(track?.currentValue).toBe(100);
		});
	});

	describe('applyTrackChanges', () => {
		it('should apply multiple track changes', () => {
			const org = createOrganization();
			const changes = [
				{ trackKey: 'exploration', amount: 50 },
				{ trackKey: 'research', amount: 25 }
			];
			system.applyTrackChanges(org, changes);

			expect(org.getProgressTrack('exploration')?.currentValue).toBe(50);
			expect(org.getProgressTrack('research')?.currentValue).toBe(25);
		});
	});

	describe('processUnlocks', () => {
		it('should return unlocks when thresholds are reached', () => {
			const org = createOrganization();
			const trackId = Identifier.generate();
			const track = new ProgressTrack(trackId, org.id, 'exploration', 100);
			org.progressTracks.set('exploration', track);

			const taskId = Identifier.generate();
			const rule = new UnlockRule('rule-1', 'exploration', 50, {
				newTaskArchetypes: [taskId]
			});

			const results = system.processUnlocks(org, [rule]);
			expect(results.length).toBe(1);
			expect(results[0].ruleId).toBe('rule-1');
			expect(results[0].newlyUnlocked.taskArchetypes).toEqual([taskId]);
		});

		it('should not return unlocks when thresholds are not reached', () => {
			const org = createOrganization();
			const trackId = Identifier.generate();
			const track = new ProgressTrack(trackId, org.id, 'exploration', 25);
			org.progressTracks.set('exploration', track);

			const rule = new UnlockRule('rule-1', 'exploration', 50, {
				newTaskArchetypes: [Identifier.generate()]
			});

			const results = system.processUnlocks(org, [rule]);
			expect(results.length).toBe(0);
		});

		it('should handle multiple unlock types', () => {
			const org = createOrganization();
			const trackId = Identifier.generate();
			const track = new ProgressTrack(trackId, org.id, 'progress', 100);
			org.progressTracks.set('progress', track);

			const taskId = Identifier.generate();
			const facilityId = Identifier.generate();
			const agentId = Identifier.generate();
			const rule = new UnlockRule('rule-1', 'progress', 50, {
				newTaskArchetypes: [taskId],
				newFacilityTemplates: [facilityId],
				newAgentTemplates: [agentId]
			});

			const results = system.processUnlocks(org, [rule]);
			expect(results.length).toBe(1);
			expect(results[0].newlyUnlocked.taskArchetypes).toEqual([taskId]);
			expect(results[0].newlyUnlocked.facilityTemplates).toEqual([facilityId]);
			expect(results[0].newlyUnlocked.agentTemplates).toEqual([agentId]);
		});
	});
});

