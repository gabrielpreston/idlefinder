# Implement Plan - Execute plan implementation with validation

## Purpose

Refresh understanding of plan details, update plan status to In Progress, begin implementation following the plan, and update plan status to Completed when done. Always prioritize using npm scripts for testing and validation.

## When to Use

Use this command when:

- A plan has been created and analyzed (via `cp.md` and `ap.md`)
- You are ready to begin implementing the plan's changes
- You need to execute plan steps systematically with validation

## Prerequisites

Before executing this command, ensure:

- Plan document exists in `.cursor/plans/` directory
- Plan has been analyzed and approved (status should be "Analysis Complete" or similar)
- You have access to codebase and can make file changes
- npm scripts are available for validation

## AI Execution Steps

### Phase 1: Context Gathering

1. **Refresh plan understanding**
   - Use `read_file` to read the plan document
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Identify current plan status and implementation phases
   - Review plan's implementation order and dependencies

2. **Get current date and update plan status**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `search_replace` to update plan status to "In Progress"
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Analysis Complete"`, `new_string: "**Plan Status**: Analysis Complete\n**Plan Status**: In Progress - {date}"`

3. **Investigate npm scripts**
   - Use `run_terminal_cmd` to discover available npm scripts
     - Command: `npm run` with `is_background: false`
   - Use `read_file` to review package.json
     - Example: `read_file` with `target_file: "package.json"`
   - Verify which validation scripts are available (type-check, test, lint, etc.)

### Phase 2: Implementation

0. **Determine implementation approach**
   - Use `read_file` to check if plan specifies refactoring approach
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - **Breaking Changes Philosophy**: This is a solo project. Breaking changes and large refactors are actively encouraged.
   - If plan calls for aggressive refactoring or modernization:
     - Use `codebase_search` to identify all affected code paths
       - Example: `codebase_search` with `query: "Where is [component being refactored] used?"` and `target_directories: []`
     - Use `grep` to find all import statements and references
       - Example: `grep` with `pattern: "import.*Component"` and `path: "src"`
     - **Accept breaking changes**: Don't try to maintain compatibility
     - **Update all dependent code directly**: No migration paths or adapters
     - **Remove deprecated code immediately**: Do not maintain both versions
     - **Prioritize modernization**: Use latest TypeScript/SvelteKit patterns
     - **Focus on type safety**: Prioritize type-check over comprehensive testing during refactoring
   - Otherwise, follow standard implementation approach

1. **Begin plan implementation**
   - Follow plan's implementation order section
   - **Before creating new code, identify reusable building blocks** (see `.cursor/rules/default-building-blocks.mdc`):
     - Use `codebase_search` to find existing domain primitives
     - Use `grep` to find existing entity patterns
     - Use `read_file` to review existing entity implementations and systems primitives spec
   - **Compose from existing building blocks**:
     - Reuse domain primitives rather than creating new ones
     - Follow existing entity patterns (constructor-based, validation in constructor)
     - Use existing systems rather than duplicating logic
     - Express new features using systems primitives vocabulary
   - For each phase or step in the plan (see `.cursor/rules/default-tool-usage.mdc`):
     - Use `codebase_search` to understand current implementation
     - Use `read_file` to read relevant files before making changes
     - If aggressive refactoring (see `.cursor/rules/default-building-blocks.mdc#breaking-changes`):
       - Refactor core components first, accepting breaking changes
       - Use `grep` to find all files importing or using refactored code
       - Update all dependent code immediately in single pass
       - Do NOT create compatibility layers or adapters
       - Remove deprecated code entirely
     - Use `search_replace` or `write` to make changes

2. **Validate changes after each major step**
   - Use `run_terminal_cmd` to run type checking (`npm run type-check`)
   - If aggressive refactoring: Fix type errors immediately, address breaking changes directly
   - Use `run_terminal_cmd` to run linting (`npm run lint`) if script exists
   - Use `run_terminal_cmd` to run tests (`npm test`) if script exists and not aggressive refactoring
   - Note: For aggressive refactoring, skip comprehensive testing - focus on type safety

3. **Continue implementation following plan**
   - Work through plan phases systematically
   - Update plan to-dos as steps are completed
   - Use `search_replace` to mark completed to-dos
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "- [ ] Task description"`, `new_string: "- [x] Task description"`

### Phase 3: Completion and Validation

1. **Run full validation suite**
   - Use `run_terminal_cmd` to run type checking
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to run linting (if available)
     - Command: `npm run lint` with `is_background: false` (verify script exists first)
   - If aggressive refactoring:
     - Focus on type safety - ensure type-check passes
     - Skip comprehensive test suites
     - Address all type errors without creating compatibility layers
   - Otherwise, use `run_terminal_cmd` to run tests (if available)
     - Command: `npm test` with `is_background: false` (verify script exists first)
   - Use `read_lints` to check for linting errors
     - Example: `read_lints` with `paths: ["src"]` or specific file paths

2. **Update plan status to Completed**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `search_replace` to update plan status
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: In Progress"`, `new_string: "**Plan Status**: In Progress\n**Plan Status**: Completed - {date}"`

## Error Handling

- **Plan file not found**: If plan document doesn't exist
  - Detection: `read_file` fails or file not found
  - Resolution: Ask user for plan file path or create plan using `cp.md` command first

- **npm script not found**: If referenced npm script doesn't exist
  - Detection: `run_terminal_cmd` returns error or `read_file` shows script missing from package.json
  - Resolution: Use alternative validation method (e.g., `npm run type-check` if available) or skip that validation step with note

- **Type checking errors**: If `npm run type-check` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code
  - Resolution: Review error output, fix type errors immediately (do not defer or create workarounds), re-run type-check
  - If aggressive refactoring: Update all dependent code directly, do not create compatibility layers

- **Linting errors**: If `npm run lint` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code or `read_lints` shows errors
  - Resolution: Review linting errors, fix issues, re-run lint or use `npm run lint -- --fix` if available

- **Test failures**: If `npm test` fails
  - Detection: `run_terminal_cmd` returns non-zero exit code
  - Resolution: Review test failures, fix issues, re-run tests

- **File modification failures**: If `search_replace` or `write` fails
  - Detection: Tool returns error or file not updated correctly
  - Resolution: Verify file path, check file permissions, verify old_string matches exactly, retry

## Success Criteria

- [ ] Plan document read and understood
- [ ] Plan status updated to "In Progress" with current date
- [ ] All plan implementation steps executed
- [ ] Changes validated with `npm run type-check` (at minimum)
- [ ] Linting validated (if script exists) or noted as unavailable
- [ ] Tests validated (if script exists) or noted as unavailable
- [ ] Plan status updated to "Completed" with current date
- [ ] All plan to-dos marked as completed

## Output Format

Implementation progress tracked through:

- Plan status updates in plan document
- To-do checkboxes marked as completed
- Validation results from npm scripts
- Final plan status showing "Completed" with date

## Notes

- Always prioritize using npm scripts for validation (`npm run type-check`, `npm run lint`, `npm test`)
- Check script existence in package.json before running (use `read_file` on package.json)
- If scripts don't exist, use available alternatives or note missing scripts
- Update plan status at start (In Progress) and end (Completed) of implementation
- Mark plan to-dos as completed as you work through implementation steps
- Follow plan's implementation order and dependencies
- **Aggressive refactoring**: When plan calls for aggressive refactoring:
  - Prioritize speed over migration safety
  - Accept breaking changes and update all dependent code directly
  - Do not create compatibility layers or adapters
  - Remove deprecated code entirely, do not maintain both versions
  - Focus on type safety (type-check) over comprehensive testing
  - Update all usages in single pass, do not defer updates
