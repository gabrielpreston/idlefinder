/**
 * Resource Slot State - FSM labels for resource slot lifecycle
 * Per Systems Primitives Spec: locked, available, occupied, disabled
 */

export type ResourceSlotState = 'locked' | 'available' | 'occupied' | 'disabled';

