/**
 * Adventurer State - FSM labels for adventurer lifecycle
 * Per Systems Primitives Spec section 10.1: Idle, OnMission, Fatigued (optional: Recovering, Dead)
 */

export type AdventurerState = 'Idle' | 'OnMission' | 'Fatigued' | 'Recovering' | 'Dead';

