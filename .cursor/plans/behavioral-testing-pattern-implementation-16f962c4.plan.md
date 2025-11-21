<!-- 16f962c4-1b51-4d47-8395-bf460aad3bf7 e3cb9630-c791-4587-a148-67ec17d2ce57 -->
# Behavioral Testing Pattern Implementation

**Plan Status**: Plan Created
**Plan Status**: Being Analyzed - 2025-11-20 15:58
**Plan Status**: Analysis Complete - 2025-11-20 15:58
**Plan Status**: In Progress - 2025-11-20 16:01
**Plan Status**: Completed - 2025-11-20 16:06

#### Analysis Scorecard

| Aspect | Score | Confidence | Notes |
|--------|-------|------------|-------|
| Problem Validation | 100% | High | TypeScript confirms errors: `resourceUnits` is private, `type` property doesn't exist |
| Evidence Verification | 95% | High | All claims validated with code references |
| Solution Appropriateness | 90% | High | Follows existing helper patterns, uses existing APIs |
| Scope Assessment | 85% | Medium | More `(action as any)` usage than initially noted (21 instances in ResolveMissionAction.test.ts) |
| Over-Engineering Check | 90% | High | Helper utilities are simple wrappers, not over-complicated |
| Implementation Feasibility | 95% | High | No new dependencies, all APIs exist |

**Overall Analysis Confidence**: 92% - Plan is well-founded with validated evidence.

## Problem Analysis

### Current Issues

1. **Private Field Access**: Tests access private implementation details

   - `ResolveMissionAction.test.ts:663`: Accesses `resourceEffect.resourceUnits` (private field)
   - `StartMissionAction.test.ts:36`: Uses `(e as any).entityId` to access private fields
   - `ResolveMissionAction.test.ts`: 21 instances of `(action as any)` accessing private state (lines 456, 458, 460, 485, 487, 489, 516, 518, 520, 545, 547, 549, 573, 575, 592, 595, 612, 614, 654, 655, 656)

2. **Structure Testing Over Behavior**: Tests verify structure without verifying functionality

   - Checking `effects.length` without applying effects (19 instances across Action tests)
   - Checking effect types without verifying they work
   - Accessing internal state instead of observable results

3. **Inconsistent Patterns**: 9 Action test files use different approaches

   - Some tests apply effects (good: `CompleteCraftingAction.test.ts:128-145`)
   - Others access private fields (bad: `ResolveMissionAction.test.ts:663`)
   - No standardized helper utilities

### Root Cause

Tests are written to verify implementation structure rather than observable behavior, making them:

- Brittle (break when internals change)
- Hard to maintain (coupled to implementation)
- Unclear (don't document expected behavior)

### Evidence

- `src/lib/domain/primitives/Effect.ts:45`: `resourceUnits` is `private readonly`
- `src/lib/domain/valueObjects/ResourceUnit.ts:6`: Property is `resourceType`, not `type`
- `src/lib/domain/actions/ResolveMissionAction.test.ts:663`: Test uses wrong property name (`u.type` vs `u.resourceType`)
- `src/lib/domain/primitives/Effect.ts:489-507`: `applyEffects()` function exists for behavioral testing

## Solution Approach

### Core Principle

**Test observable behavior through public APIs, not internal structure**

### Strategy

1. **Create Test Helper Utilities**: Provide reusable functions for common testing patterns
2. **Update Testing Documentation**: Add behavioral testing patterns to `.cursor/rules/default-testing.mdc`
3. **Refactor Existing Tests**: Migrate tests to use behavioral patterns (prioritized by impact)
4. **Establish Patterns**: Document standard test structure for future tests

### Key Patterns

#### Pattern 1: Resource Verification

```typescript
// ❌ BAD: Private field access
const resourceEffect = effects.find(e => e instanceof ModifyResourceEffect);
const fameUnit = resourceEffect.resourceUnits.find(u => u.type === 'fame');

// ✅ GOOD: Behavioral verification
const result = applyEffects(effects, entities, new ResourceBundle(new Map()));
expect(result.resources.get('fame')).toBeGreaterThan(0);
```

#### Pattern 2: Entity State Verification

```typescript
// ❌ BAD: Private state access
expect((action as any).outcome).toBe('CriticalSuccess');

// ✅ GOOD: Verify through events
const events = action.generateEvents(entities, resources, effects, {});
const payload = events[0].payload as { outcome: string };
expect(payload.outcome).toBe('CriticalSuccess');
```

#### Pattern 3: Effect Application

```typescript
// ❌ BAD: Structure checking
expect(effects.length).toBeGreaterThan(0);
expect(effects[0]).toBeInstanceOf(ModifyResourceEffect);

// ✅ GOOD: Behavior verification
const result = applyEffects(effects, entities, initialResources);
expect(result.resources.get('gold')).toBeGreaterThan(0);
```

## Implementation Plan

### Phase 1: Create Test Helper Utilities

**File**: `src/lib/test-utils/actionTestHelpers.ts`

Create helper functions for common Action testing patterns:

1. **`applyEffectsAndGetResult()`**: Wrapper around `applyEffects()` for clarity
2. **`expectResourceChange()`**: Verify resource modifications with flexible expectations
3. **`expectEntityStateChange()`**: Verify entity state/attribute changes
4. **`expectEntityCreated()`**: Verify entity creation with optional predicates

**Integration**: Export from `src/lib/test-utils/index.ts`

**References**:

- `src/lib/domain/primitives/Effect.ts:489-507`: `applyEffects()` function
- `src/lib/test-utils/index.ts:1-10`: Existing test utility exports
- `src/lib/test-utils/integrationTestHelpers.ts:30-60`: Pattern for helper functions

### Phase 2: Update Testing Documentation

**File**: `.cursor/rules/default-testing.mdc`

Add new section after line 692:

1. **Action Testing Patterns**: Behavioral testing principles
2. **Standard Test Structure**: 4-step pattern (Setup → Execute → Apply & Verify → Cleanup)
3. **Test Helper Usage**: Examples using new helpers
4. **Anti-Patterns**: What NOT to do (private field access, structure testing)

**References**:

- `.cursor/rules/default-testing.mdc:676-692`: Industry Standards section
- Existing patterns in `Effect.test.ts:30-50`: Good behavioral examples

### Phase 3: Refactor Existing Tests (Prioritized)

#### Priority 1: Fix Failing Test

**File**: `src/lib/domain/actions/ResolveMissionAction.test.ts`

- Line 663: Fix `u.type` → `u.resourceType` AND convert to behavioral test
- Test: "should include fame in rewards when fame > 0"
- Use `applyEffects()` and verify `result.resources.get('fame')`

#### Priority 2: Remove Private Field Access

**File**: `src/lib/domain/actions/StartMissionAction.test.ts`

- Line 36: Remove `(e as any).entityId` access
- Convert to behavioral verification through `applyEffects()`

#### Priority 3: Refactor Remaining Action Tests

**Files**: 7 remaining Action test files

- `CompleteCraftingAction.test.ts`: Already good pattern, verify consistency
- `UpgradeFacilityAction.test.ts`: Convert structure checks to behavior
- `StartCraftingAction.test.ts`: Convert structure checks to behavior
- `SalvageItemAction.test.ts`: Convert structure checks to behavior
- `EquipItemAction.test.ts`: Review and convert if needed
- `UnequipItemAction.test.ts`: Review and convert if needed
- `RepairItemAction.test.ts`: Review and convert if needed

**Approach**: Gradual migration, one file at a time, ensuring tests pass after each change

### Phase 4: Validation

1. **Run Test Suite**: `npm test` - all tests must pass
2. **Verify No Regressions**: Ensure no tests break during refactoring
3. **Check Coverage**: Verify test coverage maintained or improved
4. **Documentation Review**: Ensure patterns are clear and examples work

## Validation Strategy

### Test Execution

- **Command**: `npm test` (from `package.json:16`)
- **Watch Mode**: `npm test:watch` for development
- **Coverage**: Verify no coverage loss during refactoring

### Success Criteria

1. ✅ All 9 Action test files use behavioral testing patterns
2. ✅ No private field access (`as any` casts removed)
3. ✅ Test helper utilities created and exported
4. ✅ Testing documentation updated with patterns
5. ✅ All tests pass (`npm test` succeeds)
6. ✅ Failing test fixed (`ResolveMissionAction.test.ts:663`)

### Quality Gates

- **Pre-commit**: All tests pass
- **No Breaking Changes**: Tests verify same behavior, just through different means
- **Documentation**: Patterns documented for future tests
- **Consistency**: All Action tests follow same structure

## Risk Mitigation

### Risk 1: Tests Break During Refactoring

**Mitigation**:

- Refactor one test file at a time
- Run `npm test` after each change
- Keep old test logic commented initially for reference

### Risk 2: Helper Utilities Too Complex

**Mitigation**:

- Start with simple wrappers
- Add complexity only as needed
- Follow existing helper patterns (`integrationTestHelpers.ts`)

### Risk 3: Documentation Not Clear

**Mitigation**:

- Include concrete examples in documentation
- Show both bad and good patterns
- Reference existing good examples

## Dependencies

### Code Dependencies

- `src/lib/domain/primitives/Effect.ts`: `applyEffects()` function (exists)
- `src/lib/domain/primitives/Action.ts`: Action lifecycle (exists)
- `src/lib/test-utils/index.ts`: Test utility exports (exists)

### External Dependencies

- `vitest`: Test framework (already in `package.json:42`)
- No new npm packages required

## Implementation Order

1. **Phase 1** (Foundation): Create test helpers - enables all other work
2. **Phase 2** (Documentation): Update rules - provides guidance for refactoring
3. **Phase 3** (Execution): Refactor tests - applies patterns (prioritized)
4. **Phase 4** (Validation): Verify success - ensures quality

## Refactoring Approach

**Conservative Migration**: Refactor tests incrementally, one file at a time, ensuring tests pass after each change. No breaking changes to test behavior - only changing how tests verify behavior.

## Scorecard

| Aspect | Score | Confidence | Notes |

|--------|-------|------------|-------|

| Problem Understanding | 95% | High | Clear evidence from codebase analysis |

| Solution Design | 90% | High | Follows existing patterns, uses existing APIs |

| Implementation Feasibility | 85% | High | No new dependencies, incremental approach |

| Risk Management | 80% | Medium | Conservative migration reduces risk |

| Documentation Impact | 90% | High | Clear patterns, good examples available |

**Overall Confidence**: 88% - Well-understood problem with clear solution using existing patterns and APIs.

## Analysis Findings

**Analysis Date**: 2025-11-20 15:58

### Analysis Scorecard

| Aspect | Score | Confidence | Notes |
|--------|-------|------------|-------|
| Problem Validation | 100% | High | TypeScript confirms errors: `resourceUnits` is private, `type` property doesn't exist |
| Evidence Verification | 95% | High | All claims validated with code references |
| Solution Appropriateness | 90% | High | Follows existing helper patterns, uses existing APIs |
| Scope Assessment | 85% | Medium | More `(action as any)` usage than initially noted (21 instances in ResolveMissionAction.test.ts) |
| Over-Engineering Check | 90% | High | Helper utilities are simple wrappers, not over-complicated |
| Implementation Feasibility | 95% | High | No new dependencies, all APIs exist |

**Overall Analysis Confidence**: 92% - Plan is well-founded with validated evidence.

### Critical Findings

1. **TypeScript Validation Confirms Problem**
   - `npm run type-check` shows errors at `ResolveMissionAction.test.ts:663`:
     - `Property 'resourceUnits' is private and only accessible within class 'ModifyResourceEffect'`
     - `Property 'type' does not exist on type 'ResourceUnit'`
   - This validates the plan's problem analysis is correct

2. **Scope is Larger Than Initially Noted**
   - Found 21 instances of `(action as any)` in `ResolveMissionAction.test.ts` alone (lines 456, 458, 460, 485, 487, 489, 516, 518, 520, 545, 547, 549, 573, 575, 592, 595, 612, 614, 654, 655, 656)
   - Found 19 instances of `expect(effects.length)` across Action tests (structure testing)
   - Plan should note this is more extensive than initially described

3. **Helper Pattern Validation**
   - Existing helpers (`integrationTestHelpers.ts:30-60`) follow similar pattern:
     - Export functions with clear names
     - Accept options objects for flexibility
     - Return structured results
   - Proposed helpers match this pattern appropriately

4. **No Existing Effect Testing Helpers**
   - Searched `src/lib/test-utils/` - no existing helpers for effect testing
   - `applyEffects()` exists in `Effect.ts:489-507` but no test wrappers
   - Creating helpers is appropriate and not duplicating existing functionality

5. **Documentation Location Verified**
   - `.cursor/rules/default-testing.mdc` ends at line 692
   - Plan correctly identifies insertion point
   - File structure supports adding new section

### Evidence Validation

All plan claims validated:

✅ **Private Field Access**: 
- `Effect.ts:45`: `private readonly resourceUnits: ResourceUnit[]` - CONFIRMED
- `ResolveMissionAction.test.ts:663`: Accesses `resourceEffect.resourceUnits` - CONFIRMED
- `StartMissionAction.test.ts:36`: Uses `(e as any).entityId` - CONFIRMED

✅ **Wrong Property Name**:
- `ResourceUnit.ts:6`: Property is `resourceType`, not `type` - CONFIRMED
- `ResolveMissionAction.test.ts:663`: Uses `u.type` - CONFIRMED

✅ **applyEffects() Exists**:
- `Effect.ts:489-507`: Function exists and works as described - CONFIRMED

✅ **Test File Count**:
- Found 9 Action test files - CONFIRMED

✅ **Good Pattern Example**:
- `CompleteCraftingAction.test.ts:128-145`: Applies effects and verifies results - CONFIRMED

### Over-Engineering Assessment

**Assessment**: Plan is NOT over-engineered

**Reasoning**:
1. Helper utilities are simple wrappers around existing `applyEffects()` - minimal complexity
2. No new abstractions or frameworks introduced
3. Follows existing helper patterns in codebase
4. Incremental approach (one file at a time) is appropriate
5. Documentation updates are proportional to scope

**Holistic Approach Check**: ✅
- Plan addresses root cause (testing structure vs behavior)
- Creates reusable patterns for future tests
- Updates documentation to prevent regression
- No narrow fixes - comprehensive solution

### Recommendations

1. **Update Scope Description**: Note that `ResolveMissionAction.test.ts` has 21 instances of `(action as any)`, not just a few. This is more extensive but doesn't change the approach.

2. **Helper Utility Design**: Keep helpers simple as planned. The proposed functions (`expectResourceChange`, `expectEntityStateChange`, etc.) are appropriate - not over-engineered.

3. **Refactoring Priority**: The plan's prioritization (fix failing test first, then remove private access, then remaining tests) is sound and should be maintained.

4. **No Changes Needed**: Plan structure, approach, and implementation order are all appropriate. No significant corrections needed.

### Refactoring Approach Assessment

**Current Plan**: Conservative Migration - Refactor incrementally, one file at a time

**Assessment**: ✅ APPROPRIATE

**Reasoning**:
- Tests are currently passing (except the one with TypeScript errors)
- Incremental approach reduces risk of breaking multiple tests
- Allows validation after each change
- No breaking changes to test behavior - only changing verification method
- Aggressive refactoring would be risky given 9 test files and extensive `(action as any)` usage

**Recommendation**: Keep conservative approach as specified in plan.

### To-dos

- [x] Create src/lib/test-utils/actionTestHelpers.ts with helper functions (applyEffectsAndGetResult, expectResourceChange, expectEntityStateChange, expectEntityCreated)
- [x] Export actionTestHelpers from src/lib/test-utils/index.ts
- [x] Add Action Testing Patterns section to .cursor/rules/default-testing.mdc with behavioral testing principles, standard structure, and examples
- [x] Refactor ResolveMissionAction.test.ts line 663: Convert to behavioral test using applyEffects() and verify result.resources.get('fame')
- [x] Refactor StartMissionAction.test.ts: Remove (e as any).entityId access, convert to behavioral verification
- [x] Refactor remaining 7 Action test files to use behavioral patterns (CompleteCraftingAction, UpgradeFacilityAction, StartCraftingAction, SalvageItemAction, EquipItemAction, UnequipItemAction, RepairItemAction)
- [x] Run npm test to verify all tests pass after refactoring