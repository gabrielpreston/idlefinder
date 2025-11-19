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
	 */
	register(gate: GateDefinition): void {
		if (this.gates.has(gate.id)) {
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
}

/**
 * Global gate registry instance
 */
export const gateRegistry = new GateRegistry();

