import { NumericStatMap } from '$lib/domain/valueObjects/NumericStatMap';
import type { StatKey } from '$lib/domain/valueObjects/NumericStatMap';

/**
 * Converts a NumericStatMap to a JSON string for Prisma storage.
 */
export function numericStatMapToJson(statMap: NumericStatMap): string {
	const map = statMap.toMap();
	const data: Record<string, number> = {};
	for (const [key, value] of map.entries()) {
		data[key] = value;
	}
	return JSON.stringify(data);
}

/**
 * Converts a JSON string from Prisma to a NumericStatMap.
 */
export function jsonToNumericStatMap(json: string): NumericStatMap {
	const data = JSON.parse(json) as Record<string, number>;
	const map = new Map<StatKey, number>();
	for (const [key, value] of Object.entries(data)) {
		map.set(key, value);
	}
	return NumericStatMap.fromMap(map);
}

