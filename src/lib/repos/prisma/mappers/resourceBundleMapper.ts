import { ResourceBundle, ResourceUnit } from '$lib/domain/valueObjects';

/**
 * Converts a ResourceBundle to a JSON string for Prisma storage.
 */
export function resourceBundleToJson(bundle: ResourceBundle): string {
	const data = bundle.toArray().map((unit) => ({
		resourceType: unit.resourceType,
		amount: unit.amount
	}));
	return JSON.stringify(data);
}

/**
 * Converts a JSON string from Prisma to a ResourceBundle.
 */
export function jsonToResourceBundle(json: string): ResourceBundle {
	const data = JSON.parse(json) as Array<{ resourceType: string; amount: number }>;
	const units = data.map((item) => new ResourceUnit(item.resourceType, item.amount));
	return ResourceBundle.fromArray(units);
}

