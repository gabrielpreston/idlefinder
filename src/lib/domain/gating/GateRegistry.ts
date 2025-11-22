/**
 * Gate Registry
 * 
 * Central registry for all gate definitions.
 * Provides type-safe access and querying.
 */

import type { GateDefinition, GateId, GateType } from './GateDefinition';

/**
 * Central registry for all gate definitions
 * Provides type-safe access and querying
 */
export class GateRegistry {
	private gates: Map<GateId, GateDefinition> = new Map();

	/**
	 * Register a gate definition
	 * In development with HMR, gates may be registered multiple times
	 */
	register(gate: GateDefinition): void {
		if (this.gates.has(gate.id)) {
			// In development, allow re-registration (HMR can reload modules)
			// Just update the existing gate instead of throwing
			// Check for development mode
			let isDev = false;
			
			// Check Node.js environment
			if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
				isDev = true;
			}
			
			// Check Vite/SvelteKit environment (import.meta.env.DEV is available at compile time)
			// Use a try-catch to safely check for import.meta
			try {
				// Type-safe check for import.meta.env.DEV
				interface ImportMeta {
					env?: {
						DEV?: boolean;
					};
				}
				const globalWithImport = globalThis as typeof globalThis & { import?: { meta?: ImportMeta } };
				if (globalWithImport.import?.meta?.env?.DEV) {
					isDev = true;
				}
			} catch {
				// import.meta not available, continue
			}
			
			if (isDev) {
				this.gates.set(gate.id, gate);
				return;
			}
			throw new Error(`Gate ${gate.id} already registered`);
		}
		this.gates.set(gate.id, gate);
	}

	/**
	 * Register multiple gates
	 */
	registerAll(gates: GateDefinition[]): void {
		for (const gate of gates) {
			this.register(gate);
		}
	}

	/**
	 * Get gate by ID
	 */
	get(gateId: GateId): GateDefinition | undefined {
		return this.gates.get(gateId);
	}

	/**
	 * Get all gates of a specific type
	 */
	getByType(type: GateType): GateDefinition[] {
		return Array.from(this.gates.values()).filter((g) => g.type === type);
	}

	/**
	 * Get all gates
	 */
	getAll(): GateDefinition[] {
		return Array.from(this.gates.values());
	}

	/**
	 * Find gates by metadata
	 */
	findByMetadata(
		metadata: Partial<GateDefinition['metadata']>
	): GateDefinition[] {
		return Array.from(this.gates.values()).filter((gate) => {
			if (!gate.metadata || !metadata) return false;
			return Object.entries(metadata).every(([key, value]) => {
				return (
					gate.metadata?.[key as keyof typeof gate.metadata] === value
				);
			});
		});
	}

	/**
	 * Clear all registered gates
	 * Useful for development/HMR scenarios
	 */
	clear(): void {
		this.gates.clear();
	}
}

/**
 * Global gate registry instance
 */
export const gateRegistry = new GateRegistry();

