/**
 * Gating System - Main Entry Point
 * 
 * Exports all gating system components and initializes gate registry.
 */

export * from './GateDefinition';
export * from './GateRegistry';
export * from './GateEvaluator';
export * from './GateQueries';
export * from './conditions/GateConditions';
export { registerGameGates } from './gates/GameGates';

// Initialize gate registry on module load
import { registerGameGates } from './gates/GameGates';
registerGameGates();

