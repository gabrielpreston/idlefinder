# Create Plan - Design comprehensive plan for problem analysis

## Purpose

Design a plan that addresses the analysis of a problem by conducting a thorough deep dive into the codebase, tracing data flows and dependency trees, and understanding holistic implications including GitHub Workflows, npm scripts, existing documentation, tools, and scripts.

## When to Use

Use this command when:

- You have completed an analysis of a problem and need a structured plan to address it
- You need to understand the full scope of changes required across the codebase
- You want to ensure all dependencies, workflows, and documentation are considered in planning
- You need evidence-based planning with specific code citations

## Prerequisites

Before executing this command, ensure:

- Problem analysis has been completed and is available
- Access to codebase, GitHub workflows, and project documentation
- Ability to read files and execute npm scripts

## AI Execution Steps

### Phase 1: Context Gathering

1. **Gather problem context**
   - Use `read_file` to read the problem analysis or attached context
   - Use `codebase_search` to understand the problem domain
   - Use `grep` to find related code patterns

2. **Investigate npm scripts and project structure**
   - Use `run_terminal_cmd` to discover available npm scripts (`npm run`)
   - Use `read_file` to review package.json
   - Use `codebase_search` to find GitHub workflows
   - Use `read_file` to review existing documentation

3. **Trace data flows and dependencies**
   - Use `codebase_search` to trace data flows
   - Use `grep` to find dependency imports

### Phase 2: Plan Creation

1. **Create plan document**
   - Use `run_terminal_cmd` to get current date for plan metadata
   - Use `write` to create plan file in `.cursor/plans/` directory
     - File naming: `{plan-name}-{uuid}.plan.md`
     - Structure: HTML comment UUID, plan title, plan metadata, standard sections

2. **Define plan structure**
   - Problem Analysis section
   - Solution Approach section
   - Implementation Plan with phases
   - Validation Strategy section
   - Success Criteria section
   - Risk Mitigation section
   - Dependencies section
   - Implementation Order section
   - To-dos section

3. **Populate plan with evidence-based content**
   - Use `codebase_search` to find existing patterns
   - **Identify reusable building blocks** (see `.cursor/rules/default-building-blocks.mdc`):
     - Use `codebase_search` to find existing domain primitives
     - Use `grep` to find existing entity patterns
     - Use `codebase_search` to find existing systems
     - Use `read_file` to review systems primitives spec
   - **Verify composition over duplication**:
     - Check if solution can compose from existing primitives rather than creating new ones
     - Verify if new entity can extend existing entity pattern
     - Confirm if new system can reuse existing system patterns
     - Validate solution uses systems primitives vocabulary
   - Cite specific files and line numbers when claiming to follow patterns
   - Use `read_file` to verify integration points

4. **Review for over-engineering and holistic approach**
   - Check for unnecessary complexity
   - Assess if fixes are too narrow in scope
   - Consider unified patterns vs multiple narrow fixes
   - Evaluate predictability and maintainability

5. **Determine refactoring approach**
   - **Default to aggressive refactoring**: Unless there's a specific reason not to, use aggressive refactoring
   - Assess if aggressive refactoring is appropriate for this plan
   - Use `codebase_search` to understand scope of changes
     - Example: `codebase_search` with `query: "How many files use [component being refactored]?"` and `target_directories: []`
   - **For modernization and improvements**:
     - Note in plan: "**Refactoring Approach**: Aggressive - Accept breaking changes, update all dependent code directly"
     - Specify: "No migration paths or compatibility layers required"
     - Specify: "Remove deprecated code immediately, do not maintain both versions"
     - Specify: "Update all usages in single pass, do not create adapters"
     - Specify: "Breaking changes are encouraged to keep codebase modern"
   - If migration safety needed (rare), note migration strategy instead
   - Include refactoring approach in Implementation Plan section
   - **Emphasize modernization**: When modernizing code, prioritize latest standards over backwards compatibility

6. **Add scorecards and confidence scores**
   - Provide confidence score for each change with supporting arguments
   - Include scorecard of initial proposal near beginning of document
   - Use `run_terminal_cmd` to get date for plan creation timestamp
     - Command: `date '+%Y-%m-%d %H:%M'` with `is_background: false`

### Phase 3: Validation

1. **Verify plan completeness**
   - Use `read_file` to review created plan
     - Example: `read_file` with `target_file: ".cursor/plans/{plan-name}-{uuid}.plan.md"`
   - Check that all required sections are present
   - Verify evidence citations include file paths and line numbers

2. **Validate npm script references**
   - Use `read_file` to verify referenced scripts exist in package.json
     - Example: `read_file` with `target_file: "package.json"`
   - Check that scripts are appropriate for validation steps

## Error Handling

See `.cursor/rules/default-error-handling.mdc` for common error patterns.

Command-specific errors:
- **Missing problem analysis**: Ask user for problem analysis or clarify the problem to be addressed
- **Plan file creation failure**: Check `.cursor/plans/` directory exists, verify write permissions, retry with corrected path
- **Missing code references**: Verify pattern exists, adjust search query, or remove unsubstantiated claim

## Success Criteria

- [ ] Plan document created in `.cursor/plans/` directory with correct naming format
- [ ] All required sections present (Problem Analysis, Solution Approach, Implementation Plan, etc.)
- [ ] Plan includes evidence-based citations with file paths and line numbers
- [ ] npm scripts referenced in plan exist in package.json or are documented as needed
- [ ] Plan includes scorecard and confidence scores
- [ ] Plan reviewed for over-engineering and holistic approach
- [ ] Refactoring approach determined (aggressive vs migration-based)
- [ ] Plan structure follows template format with HTML comment UUID and status tracking

## Output Format

Plan document saved to `.cursor/plans/{plan-name}-{uuid}.plan.md` with:

- HTML comment with UUID at top
- Plan title and metadata (Created date, Status)
- Standard markdown sections
- Evidence-based content with code citations
- Scorecard and confidence scores
- To-dos section at end

## Notes

- Always use `codebase_search` and `grep` to verify claims before including them in plan
- Cite specific files and line numbers when referencing existing patterns
- Use `read_file` to verify integration points and dependencies
- Check npm script availability before referencing in plan
- Follow plan document format specification from template
- See `.cursor/rules/default-tool-usage.mdc` for tool usage patterns
