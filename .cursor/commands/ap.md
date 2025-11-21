# Analyze Plan - Validate and update proposed plan for correctness

## Purpose

Conduct a deep analysis of the correctness and validity of a proposed plan, present findings, and integrate fixes into the plan. Validate plan against codebase, documentation, and project standards.

## When to Use

Use this command when:

- A plan has been created (via `cp.md`) and needs validation
- You need to verify plan assumptions against actual codebase state
- You want to ensure plan follows project patterns and standards
- You need to identify gaps or over-engineering in the plan

## Prerequisites

Before executing this command, ensure:

- Plan document exists in `.cursor/plans/` directory
- Plan has been created (status should be "Plan Created" or similar)
- Access to codebase, npm scripts, and project documentation
- Ability to read files and execute validation commands

## AI Execution Steps

See `.cursor/rules/default-tool-usage.mdc` for tool usage patterns.

### Phase 1: Context Gathering

1. **Mark plan status as Being Analyzed**
   - Use `run_terminal_cmd` to get current date
   - Use `read_file` to read plan document
   - Use `search_replace` to update plan status

2. **Read plan contents (ensure not cached)**
   - Use `read_file` to read entire plan document
   - Identify plan structure, phases, and proposed changes

3. **Establish codebase context**
   - Use `codebase_search` to understand current implementation
   - Use `run_terminal_cmd` to check codebase state (`npm run type-check`)
   - Use `run_terminal_cmd` to discover npm scripts (`npm run`)
   - Use `read_file` to review package.json and documentation standards

### Phase 2: Analysis

1. **Review for over-engineering and holistic approach**
   - Use `codebase_search` to find similar implementations
     - Example: `codebase_search` with `query: "How is [similar feature] implemented?"` and `target_directories: ["src"]`
   - **Validate building block reuse** (see `.cursor/rules/default-building-blocks.mdc`):
     - Use `codebase_search` to verify plan uses existing domain primitives
     - Use `grep` to check if plan duplicates existing entities
     - Use `read_file` to review systems primitives spec
     - Verify plan composes from existing building blocks rather than creating duplicates
     - Check if plan follows systems primitives vocabulary
   - Assess if plan solutions are unnecessarily complex
   - Check if fixes are too narrow in scope
   - Evaluate if unified patterns could replace multiple narrow fixes
   - Assess predictability and maintainability of proposed changes

2. **Validate assumptions with evidence ("Prove Your Homework")**
   - For each claim in plan (e.g., "follows existing patterns"):
     - Use `grep` to find pattern in codebase
     - Use `read_file` to verify specific code references
     - Use `codebase_search` to find integration points
   - Verify architectural decisions against existing patterns
   - Validate npm script assumptions (use `read_file` to check package.json)
   - Cross-reference multiple sources when possible

3. **Validate plan against codebase state**
   - Use `run_terminal_cmd` to run type checking
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to run linting (if script exists)
     - Command: `npm run lint` with `is_background: false` (verify script exists first)
   - Use `run_terminal_cmd` to run tests (if script exists)
     - Command: `npm test` with `is_background: false` (verify script exists first)
   - Compare plan assumptions with actual codebase state

4. **Analyze documentation impact**
   - Use `codebase_search` to find existing documentation
     - Example: `codebase_search` with `query: "documentation files"` and `target_directories: ["docs", ".cursor"]`
   - Use `grep` to find documentation references
     - Example: `grep` with `pattern: "\.md"` and `path: "."`
   - Identify what documentation needs updating for proposed plan

5. **Ensure plan structure adherence**
   - Use `read_file` to verify plan has required sections
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Check for appropriate references and citations
   - Verify validation section exists

6. **Assess refactoring approach**
   - Use `read_file` to check if plan specifies refactoring approach
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - **Default to aggressive refactoring**: Unless there's a specific reason not to, recommend aggressive refactoring
   - If plan calls for aggressive refactoring or modernization (see `.cursor/rules/default-building-blocks.mdc#breaking-changes`):
     - Use `codebase_search` to identify all affected code paths
     - Use `grep` to find all import statements and references
     - Verify breaking changes are acceptable (they should be - this is a solo project)
     - Confirm that all dependent code can be updated directly
     - Validate that no migration paths are needed
     - Recommend: "**Refactoring Approach**: Aggressive - Accept breaking changes, update all dependent code directly, remove deprecated code immediately"
   - If plan includes migration paths but aggressive refactoring is appropriate:
     - **Strongly recommend** removing migration complexity in analysis findings
     - Suggest direct updates instead of compatibility layers
     - Emphasize: Breaking changes are encouraged, not avoided
     - Use `search_replace` to add recommendation to plan
       - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "## Analysis Findings"`, `new_string: "## Analysis Findings\n\n### Refactoring Approach Recommendation\n\n**Breaking Changes Encouraged**: This is a solo project. The plan should use aggressive refactoring - accept breaking changes, update all dependent code directly, and remove deprecated code immediately. No migration paths or compatibility layers needed.\n\n[Recommendation content]"`
   - If plan doesn't specify refactoring approach but significant refactoring is needed:
     - **Recommend aggressive refactoring** as the default approach
     - Emphasize that breaking changes are welcome and encouraged
     - Note that modernization should proceed without hesitation

### Phase 3: Reporting and Integration

1. **Report findings**
   - Identify which steps will not be implemented (if any)
   - Explicitly call out over-engineering issues and holistic alternatives
   - Provide confidence scores for plan stages, especially when options exist
   - Use `search_replace` to add analysis findings to plan
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "## Implementation Plan"`, `new_string: "## Analysis Findings\n\n[Findings content]\n\n## Implementation Plan"`

2. **Integrate fixes into plan**
   - Use `search_replace` to update plan sections with corrections
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "incorrect content"`, `new_string: "corrected content"`
   - Add evidence citations with file paths and line numbers
   - Update confidence scores based on findings
   - Add scorecard near beginning of plan document

3. **Mark plan status as Analysis Complete**
   - Use `run_terminal_cmd` to get current date
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`
   - Use `search_replace` to update plan status
     - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Being Analyzed"`, `new_string: "**Plan Status**: Being Analyzed\n**Plan Status**: Analysis Complete - {date}"`
   - Add analysis scorecard after plan status
     - Use `search_replace` to insert scorecard section
       - Example: `search_replace` with `file_path: ".cursor/plans/{plan-name}-{uuid}.plan.md"`, `old_string: "**Plan Status**: Analysis Complete"`, `new_string: "**Plan Status**: Analysis Complete\n\n#### Analysis Scorecard\n\n[Scorecard content]"`

## Error Handling

See `.cursor/rules/default-error-handling.mdc` for common error patterns.

Command-specific errors:
- **Plan file not found**: Ask user for plan file path or verify plan was created
- **Code references not found**: Mark claim as unsubstantiated in analysis, recommend removing or correcting
- **Plan structure issues**: Add missing sections in analysis findings, integrate into plan

## Success Criteria

- [ ] Plan status updated to "Being Analyzed" with current date
- [ ] Plan contents read and analyzed (not cached)
- [ ] Codebase context established (type-check, npm scripts, documentation reviewed)
- [ ] Plan reviewed for over-engineering and holistic approach
- [ ] All plan claims validated with evidence (file paths, line numbers)
- [ ] Plan validated against actual codebase state
- [ ] Documentation impact analyzed
- [ ] Plan structure verified for adherence
- [ ] Refactoring approach assessed and recommendations provided
- [ ] Findings reported with confidence scores
- [ ] Fixes integrated into plan document
- [ ] Plan status updated to "Analysis Complete" with date
- [ ] Analysis scorecard added to plan document

## Output Format

Analysis results integrated into plan document:

- Plan status updated with analysis dates
- Analysis findings section added with:
  - Scorecard table
  - Critical findings
  - Over-engineering review
  - Evidence validation results
  - Recommendations
- Plan sections updated with corrections and evidence citations
- Confidence scores updated based on findings

## Notes

- Always read plan document fresh (not cached) to ensure current version
- Use `codebase_search` and `grep` to verify all claims with evidence
- Cite specific file paths and line numbers for all validated claims
- Check npm script existence before referencing in validation
- Provide confidence scores for each plan phase, especially when options exist
- Explicitly call out over-engineering and propose holistic alternatives
- Add analysis scorecard near beginning of plan after status updates
