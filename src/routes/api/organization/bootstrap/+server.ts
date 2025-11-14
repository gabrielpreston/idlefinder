import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { organizationToSnapshot } from '$lib/app/dtoMappers';
import { Organization } from '$lib/domain/entities/Organization';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';
import type {
	OrganizationId,
	PlayerId,
	AgentTemplateId
} from '$lib/domain/valueObjects/Identifier';

/**
 * Bootstrap endpoint - creates or loads organization and advances world.
 * MVP: Single organization per session (simplified).
 */
export const GET: RequestHandler = async () => {
	const { advanceWorldService, organizationRepo, recruitAgentService } = createDependencies();

	// MVP: Create a single organization (in real app, would load by player ID)
	// For MVP, we'll create a default organization if none exists
	const playerId: PlayerId = Identifier.generate(); // In real app, get from session/auth
	let organization = await organizationRepo.findByOwner(playerId);

	if (!organization) {
		// Create new organization
		const orgId: OrganizationId = Identifier.generate();
		const now = Timestamp.now();
		const wallet = ResourceBundle.fromArray([new ResourceUnit('gold', 1000)]);
		organization = new Organization(
			orgId,
			playerId,
			now,
			now,
			new Map(),
			{ wallet },
			now
		);
		await organizationRepo.save(organization);

		// Create initial agents for MVP testing (recruit 2 warriors)
		const warriorTemplateId: AgentTemplateId = Identifier.from('warrior-template');
		await recruitAgentService.execute(organization.id, warriorTemplateId);
		await recruitAgentService.execute(organization.id, warriorTemplateId);
	}

	// Advance world to current time
	const now = Timestamp.now();
	await advanceWorldService.advance(organization.id, now);

	// Reload organization to get updated state
	organization = await organizationRepo.getById(organization.id);
	if (!organization) {
		throw new Error('Failed to reload organization after advance');
	}

	// Convert to DTO
	const snapshot = organizationToSnapshot(organization);

	return json({
		snapshot,
		serverTime: now.value
	});
};

