/**
 * Facility State - FSM labels for facility lifecycle
 * Per Systems Primitives Spec section 10.3: Online (optional: UnderConstruction, Disabled)
 */

export type FacilityState = 'Online' | 'UnderConstruction' | 'Disabled';

