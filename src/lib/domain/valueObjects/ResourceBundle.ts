import { ResourceUnit } from './ResourceUnit';
import type { ResourceMap } from '../primitives/Event';

/**
 * Immutable value object representing a collection of resources.
 * All operations return new instances to maintain immutability.
 */
export class ResourceBundle {
	constructor(private resources: Map<string, number>) {
		// Validate no negative amounts
		for (const [resourceType, amount] of resources.entries()) {
			if (amount < 0) {
				throw new Error(`Resource amount cannot be negative: ${resourceType} = ${amount}`);
			}
		}
	}

	/**
	 * Adds another resource bundle to this bundle, returning a new bundle.
	 */
	add(other: ResourceBundle): ResourceBundle {
		const newResources = new Map<string, number>(this.resources);
		for (const [resourceType, amount] of other.resources.entries()) {
			const currentAmount = newResources.get(resourceType) ?? 0;
			newResources.set(resourceType, currentAmount + amount);
		}
		return new ResourceBundle(newResources);
	}

	/**
	 * Subtracts another resource bundle from this bundle, returning a new bundle.
	 * Throws error if subtraction would result in negative amounts.
	 */
	subtract(other: ResourceBundle): ResourceBundle {
		const newResources = new Map<string, number>(this.resources);
		for (const [resourceType, amount] of other.resources.entries()) {
			const currentAmount = newResources.get(resourceType) ?? 0;
			const result = currentAmount - amount;
			if (result < 0) {
				throw new Error(
					`Cannot subtract ${amount} ${resourceType}: only ${currentAmount} available`
				);
			}
			if (result === 0) {
				newResources.delete(resourceType);
			} else {
				newResources.set(resourceType, result);
			}
		}
		return new ResourceBundle(newResources);
	}

	/**
	 * Checks if this bundle contains all resources in the other bundle with sufficient amounts.
	 */
	hasResources(other: ResourceBundle): boolean {
		for (const [resourceType, requiredAmount] of other.resources.entries()) {
			const availableAmount = this.get(resourceType);
			if (availableAmount < requiredAmount) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Checks if this bundle is empty (no resources or all amounts are zero).
	 */
	isEmpty(): boolean {
		if (this.resources.size === 0) {
			return true;
		}
		for (const amount of this.resources.values()) {
			if (amount > 0) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Merges another resource bundle into this bundle, returning a new bundle.
	 * Same as add() but provided for clarity.
	 */
	merge(other: ResourceBundle): ResourceBundle {
		return this.add(other);
	}

	/**
	 * Gets the amount of a specific resource type.
	 * Returns 0 if the resource type is not present.
	 */
	get(resourceType: string): number {
		return this.resources.get(resourceType) ?? 0;
	}

	/**
	 * Converts the bundle to an array of ResourceUnit objects.
	 */
	toArray(): ResourceUnit[] {
		const units: ResourceUnit[] = [];
		for (const [resourceType, amount] of this.resources.entries()) {
			if (amount > 0) {
				units.push(new ResourceUnit(resourceType, amount));
			}
		}
		return units;
	}

	/**
	 * Creates a ResourceBundle from an array of ResourceUnit objects.
	 */
	static fromArray(units: ResourceUnit[]): ResourceBundle {
		const resources = new Map<string, number>();
		for (const unit of units) {
			const currentAmount = resources.get(unit.resourceType) ?? 0;
			resources.set(unit.resourceType, currentAmount + unit.amount);
		}
		return new ResourceBundle(resources);
	}

	/**
	 * Converts the bundle to a ResourceMap format for events.
	 * Extracts gold, fame, and materials, defaulting to 0 if missing.
	 */
	toResourceMap(): ResourceMap {
		return {
			gold: this.get('gold'),
			fame: this.get('fame'),
			materials: this.get('materials')
		};
	}

	/**
	 * Calculates the delta (difference) between two resource bundles.
	 * Returns a ResourceMap with the change in each resource type.
	 * Values can be negative (resources decreased).
	 */
	static calculateResourceDelta(oldBundle: ResourceBundle, newBundle: ResourceBundle): ResourceMap {
		return {
			gold: newBundle.get('gold') - oldBundle.get('gold'),
			fame: newBundle.get('fame') - oldBundle.get('fame'),
			materials: newBundle.get('materials') - oldBundle.get('materials')
		};
	}
}

