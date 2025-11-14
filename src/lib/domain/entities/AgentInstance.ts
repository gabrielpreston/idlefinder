import type {
	AgentId,
	OrganizationId,
	AgentTemplateId,
	TaskInstanceId
} from '$lib/domain/valueObjects/Identifier';
import { NumericStatMap } from '$lib/domain/valueObjects/NumericStatMap';
import { AgentTemplate } from './AgentTemplate';

/**
 * Agent status types.
 */
export type AgentStatus = 'IDLE' | 'ASSIGNED' | 'INJURED' | 'UNAVAILABLE';

/**
 * Domain entity representing an agent instance owned by an organization.
 * Agents can be assigned to tasks, gain XP, and level up.
 */
export class AgentInstance {
	constructor(
		public readonly id: AgentId,
		public readonly organizationId: OrganizationId,
		public readonly templateId: AgentTemplateId,
		public level: number,
		public experience: number,
		public effectiveStats: NumericStatMap,
		public status: AgentStatus,
		public currentTaskId?: TaskInstanceId,
		private template?: AgentTemplate
	) {
		if (level < 1) {
			throw new Error(`Agent level must be at least 1, got ${level}`);
		}
		if (experience < 0) {
			throw new Error(`Agent experience cannot be negative, got ${experience}`);
		}
	}

	/**
	 * Assigns this agent to a task.
	 * Sets status to 'ASSIGNED' and stores the task ID.
	 */
	assignToTask(taskId: TaskInstanceId): void {
		if (this.status !== 'IDLE') {
			throw new Error(`Cannot assign agent to task: agent status is ${this.status}`);
		}
		this.status = 'ASSIGNED';
		this.currentTaskId = taskId;
	}

	/**
	 * Completes the current task.
	 * Clears the task ID and returns agent to IDLE status.
	 */
	completeTask(): void {
		if (this.status !== 'ASSIGNED') {
			throw new Error(`Cannot complete task: agent status is ${this.status}`);
		}
		this.currentTaskId = undefined;
		this.status = 'IDLE';
	}

	/**
	 * Applies experience points to the agent.
	 * Checks for level up and triggers it if needed.
	 */
	applyXP(amount: number): void {
		if (amount < 0) {
			throw new Error(`Cannot apply negative XP: ${amount}`);
		}
		this.experience += amount;
		this.checkLevelUp();
	}

	/**
	 * Checks if the agent should level up based on experience.
	 * For MVP, uses simple formula: level up every 100 XP per level.
	 */
	private checkLevelUp(): void {
		const xpRequired = this.level * 100;
		if (this.experience >= xpRequired) {
			this.levelUp();
		}
	}

	/**
	 * Levels up the agent.
	 * Increments level and recalculates effectiveStats if template is available.
	 */
	levelUp(): void {
		this.level += 1;
		if (this.template) {
			this.effectiveStats = this.template.computeStatsAtLevel(this.level);
		}
	}

	/**
	 * Marks the agent as injured.
	 */
	markInjured(): void {
		this.status = 'INJURED';
		if (this.currentTaskId) {
			this.currentTaskId = undefined;
		}
	}

	/**
	 * Recovers the agent from injury.
	 * Sets status to 'IDLE' if currently injured.
	 */
	recover(): void {
		if (this.status === 'INJURED') {
			this.status = 'IDLE';
		}
	}

	/**
	 * Sets the template for this agent instance.
	 * Used to recalculate effectiveStats when leveling up.
	 */
	setTemplate(template: AgentTemplate): void {
		this.template = template;
		this.effectiveStats = template.computeStatsAtLevel(this.level);
	}
}

