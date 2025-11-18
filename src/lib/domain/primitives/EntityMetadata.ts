/**
 * Entity Metadata - Structured metadata per Systems Primitives Spec section 1
 * Spec lines 43-48: displayName, description, loreTags, visualKey
 */

export interface EntityMetadata {
	displayName?: string;
	description?: string;
	loreTags?: string[];
	visualKey?: string;
	[key: string]: unknown; // Allow extension for entity-specific metadata
}

