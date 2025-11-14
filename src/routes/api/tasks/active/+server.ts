import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createDependencies } from '$lib/app/dependencies';
import { taskInstanceToDTO } from '$lib/app/dtoMappers';
import { Identifier } from '$lib/domain/valueObjects/Identifier';
import { Timestamp } from '$lib/domain/valueObjects/Timestamp';
import type { OrganizationId } from '$lib/domain/valueObjects/Identifier';
import type { TaskInstanceDTO } from '$lib/types';

/**
 * Active tasks endpoint - returns active task instances for organization.
 */
export const GET: RequestHandler = async ({ url }) => {
	const organizationIdParam = url.searchParams.get('organizationId');

	if (!organizationIdParam) {
		throw error(400, { message: 'organizationId query parameter is required' });
	}

	const { taskRepo } = createDependencies();
	const organizationId: OrganizationId = Identifier.from(organizationIdParam);

	const activeTasks = await taskRepo.findActiveTasksForOrganization(organizationId);
	const allArchetypes = await taskRepo.getAllArchetypes();
	// Use .value as Map key since Identifier objects don't compare by value in Map
	const archetypesMap = new Map(allArchetypes.map((a) => [a.id.value, a]));

	const now = Timestamp.now();
	const taskDTOs: TaskInstanceDTO[] = [];
	for (const task of activeTasks) {
		const archetype = archetypesMap.get(task.taskArchetypeId.value);
		if (archetype) {
			taskDTOs.push(taskInstanceToDTO(task, archetype, now));
		}
	}

	return json(taskDTOs);
};

