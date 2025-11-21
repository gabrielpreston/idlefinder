<!-- 4ebcfaf0-35cf-4e0b-af6f-a4766cb50ef8 7f16cbbf-ba31-44d2-8e17-7f7813f80359 -->
# Auto-generate Adventurer Names

<!-- UUID: 7f8e9d2a-4b3c-5d6e-7f8a-9b0c1d2e3f4a -->

**Created**: 2025-11-21 13:41
**Status**: Analysis Complete (2025-11-21 13:43)
**Status**: In Progress - 2025-11-21 13:48
**Status**: Completed - 2025-11-21 13:50

## Analysis Scorecard

| Aspect | Score | Notes |
|--------|-------|-------|
| **Plan Completeness** | 9/10 | All major areas covered, minor test file additions noted |
| **Code References** | 10/10 | All file paths and line numbers verified |
| **Architecture Alignment** | 10/10 | Follows existing patterns (systems folder, pure functions) |
| **Risk Assessment** | 9/10 | Good risk identification, additional test files noted |
| **Implementation Clarity** | 9/10 | Clear phases, well-defined steps |
| **Breaking Changes** | 8/10 | Correctly identified as acceptable, backward compatible (optional) |

## Analysis Findings

**Analysis Date**: 2025-11-21 13:43

### Codebase Validation

✅ **Type Checking**: Passes (`npm run type-check`)
✅ **Test Suite**: All tests passing (39 test files, 0 failures)
✅ **Code References**: All file paths and line numbers verified
✅ **Architecture**: Name generator placement in `systems/` folder follows existing pattern (`RecruitPoolSystem.ts`)

### Critical Findings

1. **Additional Test Files Requiring Updates**: Found 3 additional integration test files that use `RecruitAdventurer` with explicit names:
   - `src/lib/__tests__/integration/mission-lifecycle.integration.test.ts` (7 usages)
   - `src/lib/__tests__/integration/player-journey.integration.test.ts` (3 usages)
   - `src/lib/__tests__/integration/command-flow.integration.test.ts` (3 usages)

   **Impact**: These tests will continue to work (name is optional, not removed), but should be updated to test auto-generation in future iterations.

2. **AgentRoster.svelte Status**: Component exists but is not actively used (no imports found). Can be left as-is for now, removed in future cleanup.

3. **File Location Confirmed**: `src/lib/domain/systems/adventurerNameGenerator.ts` is correct location - follows pattern from `RecruitPoolSystem.ts:22-70` (pure function, no side effects).

### Evidence Validation

| Claim | Status | Evidence |
|-------|--------|----------|
| Handler validates name at lines 32-45 | ✅ Verified | `src/lib/handlers/RecruitAdventurerHandler.ts:32-45` |
| Command type requires name | ✅ Verified | `src/lib/bus/types.ts:98` |
| UI has name input | ✅ Verified | `RecruitPreviewModal.svelte:100-111` |
| Tests verify name validation | ✅ Verified | `RecruitAdventurerHandler.integration.test.ts:52-88, 260-282` |
| Systems folder pattern | ✅ Verified | `RecruitPoolSystem.ts:22-70` |

### Over-Engineering Review

✅ **No Over-Engineering Detected**: Plan is appropriately scoped:

- Simple name generator (can be enhanced later)
- Minimal changes to existing code
- No unnecessary abstractions
- Follows existing patterns

### Refactoring Approach Assessment

✅ **Aggressive Refactoring Confirmed**: Plan correctly specifies aggressive refactoring:

- Breaking changes acceptable (solo project)
- No migration paths needed
- Direct updates to all dependent code
- Remove deprecated validation immediately

### Updated Confidence Scores

Based on analysis:

- **Name Generator Implementation**: 98% ⬆️ (Simple function, clear pattern to follow)
- **Command Type Update**: 100% (No change - straightforward)
- **Handler Update**: 95% ⬆️ (All name usages identified, clear logic)
- **UI Update**: 95% (No change - straightforward)
- **Test Updates**: 80% ⬇️ (Additional test files found, but they'll still work with optional name)

### Recommendations

1. **Phase 5 Enhancement**: Add note about additional test files - they don't need immediate updates (name is optional), but could be enhanced later to test auto-generation.

2. **Future Enhancement Path**: Plan correctly identifies that name generator can be enhanced with fantasy names, class/ancestry-based names, etc. - good forward-thinking.

3. **No Blockers**: All assumptions validated, plan is ready for implementation.

## Problem Analysis

Currently, users must manually enter a name when recruiting adventurers, creating unnecessary friction in the recruitment flow. The system requires names in multiple places:

1. **Command Handler** (`src/lib/handlers/RecruitAdventurerHandler.ts:32-45`): Validates that name is provided and not empty
2. **UI Components**:
   - `RecruitPreviewModal.svelte:100-111`: Name input field with validation
   - `AgentRoster.svelte:46`: Name input (legacy component, not actively used)
3. **Command Type** (`src/lib/bus/types.ts:98`): `name` is required in `RecruitAdventurerCommand`
4. **Tests** (`RecruitAdventurerHandler.integration.test.ts:52-88`): Multiple tests verify name validation failures

The user wants to remove this friction by auto-generating names using a simple approach that can be enhanced later with more diverse name generation.

## Solution Approach

Implement auto-generated names with a simple pattern that can be enhanced in the future:

1. **Create name generator utility**: Simple function that generates names from adventurer IDs (e.g., "Adventurer [short ID]")
2. **Make name optional**: Update command type to make `name` optional
3. **Auto-generate in handler**: If name not provided, generate one automatically
4. **Remove UI inputs**: Remove name input fields from recruitment modals
5. **Update tests**: Remove name validation tests, add auto-generation tests

**Refactoring Approach**: Aggressive - Accept breaking changes, update all dependent code directly. No migration paths or compatibility layers required. Remove deprecated validation code immediately.

## Implementation Plan

### Phase 1: Create Name Generator Utility

**File**: `src/lib/domain/systems/adventurerNameGenerator.ts` (new)

- Create simple name generator function
- Pattern: `generateAdventurerName(adventurerId: string): string`
- Implementation: Use first 8 characters of UUID (uppercase) → `"Adventurer [SHORT_ID]"`
- Add TODO comment for future enhancements (fantasy names, class/ancestry-based names, etc.)

**Evidence**: Following domain system pattern from `src/lib/domain/systems/RecruitPoolSystem.ts:22-70` - pure function, no side effects.

### Phase 2: Update Command Type

**File**: `src/lib/bus/types.ts:97-101`

- Change `name: string` to `name?: string` (optional)
- Keep `traits` and `previewAdventurerId` unchanged

**Evidence**: Current definition at `src/lib/bus/types.ts:97-101`.

### Phase 3: Update Handler

**File**: `src/lib/handlers/RecruitAdventurerHandler.ts`

- Remove name validation (lines 31-46)
- Import name generator: `import { generateAdventurerName } from '../domain/systems/adventurerNameGenerator';`
- Auto-generate name if not provided: `const adventurerName = payload.name?.trim() || generateAdventurerName(adventurerId);`
- Use `adventurerName` instead of `payload.name` throughout (lines 146, 169)

**Evidence**: Current handler at `src/lib/handlers/RecruitAdventurerHandler.ts:25-180`.

### Phase 4: Update UI Components

**File**: `src/lib/components/roster/RecruitPreviewModal.svelte`

- Remove `name` variable (line 16)
- Remove `validationError` for name (line 17, 35-37)
- Remove name input field (lines 100-111)
- Remove name validation from `handleRecruit` (lines 35-37)
- Update button disabled condition: remove `!name.trim()` check (line 125)
- Remove name from command dispatch (line 48)
- Clean up unused form state in `handleClose` (line 59)

**Evidence**: Current component at `src/lib/components/roster/RecruitPreviewModal.svelte:1-226`.

**File**: `src/lib/components/AgentRoster.svelte` (if still referenced)

- Check if component is used (grep shows no references)
- If unused, can be left as-is or removed in future cleanup

### Phase 5: Update Tests

**File**: `src/lib/handlers/RecruitAdventurerHandler.integration.test.ts`

- **Remove tests**:
- `should fail when name is empty` (lines 52-69)
- `should fail when name is whitespace only` (lines 71-88)
- Duplicate tests at lines 260-282
- **Update tests**:
- `should recruit adventurer with name` (line 27): Keep but make name optional
- `should recruit adventurer with preview adventurer` (line 172): Update to not require name
- `should recruit adventurer with random generation` (line 217): Update to test auto-generation
- **Add new test**: `should auto-generate name when not provided`
- Dispatch command without name
- Verify name is auto-generated (starts with "Adventurer")
- Verify name contains short ID from adventurer ID

**Evidence**: Current tests at `src/lib/handlers/RecruitAdventurerHandler.integration.test.ts:12-359`.

**File**: `src/lib/components/roster/AdventurerCard.test.ts`

- Tests should continue to work (they use `createTestAdventurer` with names)
- No changes needed unless we want to test auto-generated names

**File**: `src/lib/__tests__/integration/ui-edge-cases.integration.test.ts`

- Test for long names (line 155) should still work
- No changes needed

**Additional Test Files** (found during analysis - no immediate changes needed):

- `src/lib/__tests__/integration/mission-lifecycle.integration.test.ts`: Uses `RecruitAdventurer` with explicit names (7 usages) - will continue to work since name is optional
- `src/lib/__tests__/integration/player-journey.integration.test.ts`: Uses `RecruitAdventurer` with explicit names (3 usages) - will continue to work
- `src/lib/__tests__/integration/command-flow.integration.test.ts`: Uses `RecruitAdventurer` with explicit names (3 usages) - will continue to work

**Note**: These additional test files don't require immediate updates since `name` becomes optional (not removed). They can be enhanced in future iterations to test auto-generation behavior.

## Validation Strategy

### Pre-Implementation

- [ ] Review plan with user
- [ ] Verify no other components depend on name input

### During Implementation

- [ ] Run `npm run type-check` after each phase
- [ ] Run `npm test` after Phase 5 (test updates)
- [ ] Verify no TypeScript errors

### Post-Implementation

- [ ] Run full test suite: `npm test`
- [ ] Run linter: `npm run lint`
- [ ] Manual testing:
- Recruit adventurer from preview pool (should auto-generate name)
- Verify name appears correctly in roster
- Verify name appears in mission assignments
- Verify name appears in adventurer detail modal

## Success Criteria

- [ ] Adventurers are auto-named when recruited (no manual input required)
- [ ] Auto-generated names follow pattern: "Adventurer [SHORT_ID]"
- [ ] All existing tests pass (after updates)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] UI no longer shows name input field
- [ ] Recruitment flow is simplified (one-click recruit)

## Risk Mitigation

**Risk**: Tests may break if they expect specific names

- **Mitigation**: Update all tests in Phase 5, verify test suite passes

**Risk**: Existing saved games may have manually-named adventurers

- **Mitigation**: Not a concern - existing names are preserved, only new recruits are auto-named

**Risk**: Name generator may create duplicate names

- **Mitigation**: UUID-based generation ensures uniqueness (very low collision probability)

**Risk**: Simple name pattern may not be user-friendly

- **Mitigation**: This is intentional - simple for now, can be enhanced later with fantasy name generation

## Dependencies

- **Domain Systems**: Name generator follows pattern from `RecruitPoolSystem.ts`
- **Command Bus**: Command type change affects all dispatchers (only `RecruitPreviewModal` currently)
- **Test Utilities**: `createTestAdventurer` in `testFactories.ts` may need updates if tests change

## Implementation Order

1. Phase 1: Create name generator (foundation)
2. Phase 2: Update command type (enables optional name)
3. Phase 3: Update handler (core logic)
4. Phase 4: Update UI (user-facing changes)
5. Phase 5: Update tests (validation)

## Scorecard

**Initial Proposal Assessment**:

| Aspect | Score | Notes |
|--------|-------|-------|
| **Simplicity** | 9/10 | Simple name pattern, minimal changes |
| **User Experience** | 9/10 | Removes friction, one-click recruit |
| **Maintainability** | 8/10 | Simple now, easy to enhance later |
| **Test Coverage** | 7/10 | Need to update tests, add auto-gen test |
| **Breaking Changes** | 6/10 | Command type change, but backward compatible (optional) |

**Confidence Scores** (Updated after analysis):

- **Name Generator Implementation**: 98% ⬆️ - Simple function, clear pattern to follow (`RecruitPoolSystem.ts`)
- **Command Type Update**: 100% - Straightforward optional property, verified
- **Handler Update**: 95% ⬆️ - All name usages identified (lines 32-45, 146, 169), clear logic
- **UI Update**: 95% - Remove input field, straightforward, verified
- **Test Updates**: 80% ⬇️ - Additional test files found (3 integration test files), but they'll continue to work since name is optional

## To-dos

- [x] Create `src/lib/domain/systems/adventurerNameGenerator.ts` with `generateAdventurerName` function
- [x] Update `RecruitAdventurerCommand` interface to make `name` optional
- [x] Update `RecruitAdventurerHandler` to auto-generate names
- [x] Remove name input from `RecruitPreviewModal.svelte`
- [x] Remove name validation tests from integration test file
- [x] Add test for auto-generated names
- [x] Update existing tests that require specific names
- [x] Run full test suite and fix any failures
- [x] Run linter and fix any issues
- [ ] Manual testing of recruitment flow
