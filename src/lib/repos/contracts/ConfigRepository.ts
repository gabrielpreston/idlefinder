import type { UnlockRule } from '$lib/domain/entities/UnlockRule';

/**
 * Repository interface for configuration data persistence.
 */
export interface ConfigRepository {
	/**
	 * Gets all unlock rules.
	 */
	getUnlockRules(): Promise<UnlockRule[]>;
}

