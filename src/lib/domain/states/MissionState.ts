/**
 * Mission State - FSM labels for mission lifecycle
 * Per Systems Primitives Spec section 10.2: Available, InProgress, Completed, Expired
 */

export type MissionState = 'Available' | 'InProgress' | 'Completed' | 'Expired';

