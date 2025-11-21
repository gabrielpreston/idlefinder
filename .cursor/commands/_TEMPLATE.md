# [Command Name] - [Brief Description]

## Purpose

[One sentence describing what this command does and when it should be used]

## When to Use

Use this command when:

- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

## Prerequisites

Before executing this command, ensure:

- [Required context or state]
- [Required tools or dependencies]
- [Required files or directories exist]

## Reusable Building Blocks & Best Principles

See `.cursor/rules/default-building-blocks.mdc` for complete building block reference including:
- Domain Primitives (Identifier, Timestamp, Duration, ResourceBundle, etc.)
- Systems Primitives (Entity Pattern, Vocabulary, Core Entities, Systems)
- Architecture Principles (Domain Purity, Value Object Immutability, etc.)
- Breaking Changes & Modernization Philosophy

## AI Execution Steps

See `.cursor/rules/default-command-structure.mdc#ai-execution-steps` for standard phase structure.

Command-specific execution steps:
- [Command-specific Phase 1 steps]
- [Command-specific Phase 2 steps]
- [Command-specific Phase 3 steps]

## Error Handling

See `.cursor/rules/default-error-handling.mdc` for common error patterns.

Command-specific errors:
- **[Error Type]**: [How to handle]
  - Detection: [How to identify this error]
  - Resolution: [How to fix or recover]

## Success Criteria

See `.cursor/rules/default-command-structure.mdc#success-criteria` for standard checklist template.

Command-specific criteria:
- [ ] Criterion 1: [Specific measurable outcome]
- [ ] Criterion 2: [Specific measurable outcome]

## Output Format

See `.cursor/rules/default-command-structure.mdc#output-format` for standard format template.

Command-specific output:
- [Define expected output structure, format, or location]

## Tool Usage Reference

See `.cursor/rules/default-tool-usage.mdc` for complete tool usage patterns and examples.

## Plan Document Format (for commands that read/write plans)

When creating or reading plan documents:

- **File naming**: `{plan-name}-{uuid}.plan.md`
  - Example: `standardize-cursor-commands-for-ai-execution-0b714937.plan.md`
- **Structure**:
  1. HTML comment with UUID: `<!-- {uuid} {uuid} -->`
  2. Plan title: `# {Plan Name}`
  3. Plan metadata: `**Plan Created**:`, `**Plan Status**:`
  4. Standard sections: Problem Analysis, Solution Approach, Implementation Plan, etc.
  5. To-dos section at end: `### To-dos` with checkboxes
- **Status values**: Created, Being Analyzed, Analysis Complete, In Progress, Completed
- **Location**: `.cursor/plans/` directory

## Notes

- All tool usage must be explicit - never assume implicit actions
- Always include validation checkpoints after major operations
- Follow project documentation standards (100 char line length, proper markdown formatting)
- Preserve all existing functionality when refactoring commands

