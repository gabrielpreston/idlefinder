/**
 * AutoEquipRules Entity - Configuration entity for auto-equip system
 * Per Systems Primitives Spec and plan correction: Must be entity in GameState.entities Map
 * Structure: id, type, attributes, tags, state, timers, metadata
 */

import type { Identifier } from '../valueObjects/Identifier';
import type { AutoEquipRulesAttributes } from '../attributes/AutoEquipRulesAttributes';
import type { AutoEquipRulesState } from '../states/AutoEquipRulesState';
import type { Entity } from '../primitives/Requirement';
import type { EntityMetadata } from '../primitives/EntityMetadata';
import type { RoleKey } from '../attributes/RoleKey';
import type { StatPriority } from '../attributes/AutoEquipRulesAttributes';

export type AutoEquipRulesId = Identifier<'AutoEquipRulesId'>;

/**
 * AutoEquipRules Entity - Per plan Phase 2.1
 * Must be stored in GameState.entities Map (not metadata)
 */
export class AutoEquipRules implements Entity {
	private readonly _id: AutoEquipRulesId;
	readonly id: string; // String ID for Entity interface compatibility
	readonly type = 'AutoEquipRules' as const;
	readonly attributes: AutoEquipRulesAttributes;
	readonly tags: ReadonlyArray<string>;
	state: AutoEquipRulesState;
	timers: Record<string, number | null>; // Mutable for timer updates (milliseconds per spec)
	readonly metadata: EntityMetadata;

	constructor(
		id: AutoEquipRulesId,
		attributes: AutoEquipRulesAttributes,
		tags: string[] = [],
		state: AutoEquipRulesState = 'Active',
		timers: Record<string, number | null> = {},
		metadata: EntityMetadata = {}
	) {
		this._id = id;
		this.id = id.value; // String ID for Entity interface
		this.attributes = attributes;
		this.tags = [...tags]; // Create copy for immutability
		this.state = state;
		this.timers = { ...timers }; // Create copy
		// Ensure metadata.loreTags is copied for immutability if present
		this.metadata = metadata.loreTags
			? { ...metadata, loreTags: [...metadata.loreTags] }
			: { ...metadata }; // Create copy
	}

	/**
	 * Update focus
	 */
	updateFocus(focus: AutoEquipRulesAttributes['focus']): void {
		this.attributes.focus = focus;
	}

	/**
	 * Update allow rare auto-equip setting
	 */
	updateAllowRareAutoEquip(allow: boolean): void {
		this.attributes.allowRareAutoEquip = allow;
	}

	/**
	 * Update role priorities
	 */
	updateRolePriorities(roleKey: RoleKey, priorities: StatPriority[]): void {
		this.attributes.rolePriorities.set(roleKey, [...priorities]);
	}

	/**
	 * Get default auto-equip rules
	 */
	static createDefault(id: AutoEquipRulesId): AutoEquipRules {
		const rolePriorities = new Map<RoleKey, StatPriority[]>();
		
		// Frontline: AC → DR → Attack → Skill
		rolePriorities.set('martial_frontliner', ['armorClass', 'damageReduction', 'attackBonus', 'skillBonus']);
		
		// Casters: Skill → Crit Safety → AC
		rolePriorities.set('support_caster', ['skillBonus', 'critSafety', 'armorClass']);
		
		// Strikers: Attack → Damage → AC
		rolePriorities.set('mobile_striker', ['attackBonus', 'damageBonus', 'armorClass']);
		
		// Skill Specialists: Skill → Crit Safety → Balanced stats
		rolePriorities.set('skill_specialist', ['skillBonus', 'critSafety', 'attackBonus', 'armorClass']);

		return new AutoEquipRules(
			id,
			{
				focus: 'balanced',
				allowRareAutoEquip: true,
				rolePriorities
			},
			['auto-equip-config'],
			'Active',
			{},
			{ displayName: 'Auto-Equip Rules' }
		);
	}
}

