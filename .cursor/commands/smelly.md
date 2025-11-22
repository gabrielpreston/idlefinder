# Code Smells - Detect anti-patterns, legacy code, and dead code

## Purpose

Analyze the codebase to identify anti-patterns, code smells, legacy code, dead code, and maintainability issues that should be addressed to keep the project healthy and understandable.

## When to Use

Use this command when:

- You want to perform a health check on the codebase
- Before starting a major refactoring to identify problem areas
- After completing a feature to ensure code quality standards
- During code review to identify potential issues
- When onboarding to understand technical debt

## Prerequisites

Before executing this command, ensure:

- Codebase is accessible and npm scripts are available
- TypeScript and ESLint configurations are in place
- Access to project rules and architecture documentation

## Reusable Building Blocks & Best Principles

See `.cursor/rules/default-building-blocks.mdc` for complete building block reference including:
- Domain Primitives (Identifier, Timestamp, Duration, ResourceBundle, etc.)
- Systems Primitives (Entity Pattern, Vocabulary, Core Entities, Systems)
- Architecture Principles (Domain Purity, Value Object Immutability, etc.)

## Code Smell Detection Categories

### Architecture Anti-Patterns

**Domain Purity Violations**:
- Domain entities/systems depending on infrastructure (bus, UI, etc.)
- Direct database access in domain logic
- Framework dependencies in domain layer
- Side effects in pure domain systems

**Value Object Issues**:
- Mutable value objects
- Value objects used directly as Map/Set keys (should use `.value`)
- Missing immutability enforcement
- Duplicate value object implementations

**Entity Pattern Violations**:
- Using `Partial<T>` spreads instead of constructor-based initialization
- Missing validation in constructors
- Direct mutation of readonly properties
- Entities not following systems primitives pattern

**System Impurity**:
- Systems with side effects (should be pure functions)
- Systems calling `Date.now()` instead of receiving timestamps
- Non-deterministic behavior in systems
- Systems depending on infrastructure

### TypeScript Anti-Patterns

**Type Safety Issues**:
- Use of `any` without justification
- Missing return type annotations
- Use of `@ts-ignore` or `@ts-expect-error` without explanation
- Type assertions (`as`) without validation
- Implicit `any` from missing types

**Type Annotation Gaps**:
- Function parameters without types
- Class properties without types
- Variable declarations without types (when not obvious)
- Generic types with missing constraints

### Code Organization Anti-Patterns

**Import Organization**:
- Mixed import ordering (should be: external, domain, systems, app, repos)
- Circular dependencies between modules
- Deep import paths (consider re-exports)
- Unused imports

**Code Duplication**:
- Duplicate domain primitives (should reuse existing)
- Duplicate entity patterns (should extend or compose)
- Duplicate business logic (should extract to system)
- Duplicate validation logic

**Naming Violations**:
- Inconsistent naming conventions (should be camelCase for variables/functions)
- Non-descriptive variable names (`x`, `temp`, `data`)
- Magic numbers without named constants
- Abbreviations that reduce clarity

### Legacy Code Patterns

**Deprecated Patterns**:
- Old entity initialization patterns
- Deprecated value object constructors
- Legacy system interfaces
- Outdated repository patterns

**Dead Code**:
- Unused functions or classes
- Unreachable code paths
- Commented-out code blocks
- Unused dependencies in package.json

**Missing Modernization**:
- Can use newer TypeScript features (optional chaining, nullish coalescing)
- Can use newer JavaScript features (Array methods, destructuring)
- Can use domain primitives instead of raw types

### Modernization Opportunities

**Outdated Patterns to Modernize**:
- Code using old TypeScript patterns (can use newer features)
- Legacy entity initialization patterns
- Deprecated value object constructors
- Old system interfaces that could use modern patterns
- Code that could use latest SvelteKit patterns
- Dependencies that could be updated to latest versions

**Modernization Detection** (see `.cursor/rules/default-building-blocks.mdc#breaking-changes`):
- Use `codebase_search` to find code using old patterns
- Use `grep` to find deprecated patterns
- Check package.json for outdated dependencies (use `read_file`)
- Note: Breaking changes are acceptable when updating dependencies

**Modernization Recommendations**:
- Identify code that could use latest TypeScript features (satisfies, const assertions, etc.)
- Find patterns that could use latest SvelteKit features
- Recommend removing deprecated code paths entirely (not maintaining both)
- Suggest large-scale refactors to modernize entire subsystems
- Encourage breaking changes to improve code quality

### Performance Anti-Patterns

**Memory Issues**:
- Object creation in hot paths (game loops, render functions)
- Missing object pooling for frequently created objects
- Memory leaks from event listeners
- Large object allocations without cleanup

**Inefficient Patterns**:
- Unnecessary re-computations (should cache/memoize)
- Inefficient loops (nested O(n²) when O(n) possible)
- Excessive DOM manipulation
- Synchronous operations blocking render

### Testing Anti-Patterns

**Missing Tests**:
- Domain systems without unit tests
- Critical business logic without tests
- Entity validation without tests
- Complex calculations without tests

**Poor Test Quality**:
- Tests that don't test anything meaningful
- Tests with unclear expectations
- Tests that rely on implementation details
- Brittle tests that break with refactoring

## AI Execution Steps

### Phase 1: Context Gathering

1. **Gather project structure and rules**
   - Use `read_file` to read architecture rules and TypeScript standards
   - Use `list_dir` to understand directory structure

2. **Run static analysis tools**
   - See `.cursor/rules/default-tool-usage.mdc#npm-script-validation` for validation sequence
   - Follow standard validation sequence (type-check, lint, test)

### Phase 2: Pattern Detection

1. **Scan for architecture violations**
   - Use `grep` to find domain entities importing infrastructure
   - Use `codebase_search` to find system impurities
   - Use `grep` to find value objects used as Map/Set keys without `.value`
   - Use `grep` to find direct Prisma usage in domain

2. **Detect TypeScript anti-patterns**
   - Use `grep` to find `any` usage, `@ts-ignore` comments, type assertions
   - Use `codebase_search` to find functions without return types

3. **Find code duplication**
   - Use `codebase_search` to find duplicate patterns
   - Use `grep` to find similar function signatures

4. **Identify dead code**
   - Use `grep` to find commented-out code blocks
   - Use `codebase_search` to find potentially unused exports
   - Use `grep` to find unreachable code

5. **Check performance patterns**
   - Use `codebase_search` to find object creation in loops
   - Use `grep` to find potential memory leaks
   - Use `codebase_search` to find inefficient algorithms

6. **Check entity and value object patterns**
   - Use `grep` to find `Partial<T>` usage in entity constructors
   - Use `codebase_search` to find entities without validation
   - Use `grep` to find mutable value objects

7. **Check import organization**
   - Use `grep` to find import statements
   - Use `read_file` to check import ordering in sample files

### Phase 3: Analysis and Reporting

1. **Categorize findings by severity**
   - **Critical**: Architecture violations, type safety issues, system impurities
   - **High**: Code duplication, missing tests for critical logic, performance issues
   - **Medium**: Naming violations, import organization, legacy patterns
   - **Low**: Minor code style issues, opportunities for modernization

2. **Provide evidence for each finding**
   - Use `read_file` to show specific code examples
   - Include file paths and line numbers for all findings
   - Show the actual code that violates the pattern
   - Explain why it's a problem and suggest a fix

3. **Generate actionable recommendations**
   - For each finding, provide:
     - What the issue is (with code citation)
     - Why it's problematic
     - How to fix it (with example or pattern reference)
     - Priority level (Critical/High/Medium/Low)

4. **Create summary report**
   - Count findings by category
   - Prioritize recommendations
   - Suggest phased approach if many issues found

## Error Handling

See `.cursor/rules/default-error-handling.mdc` for common error patterns.

Command-specific errors:
- **No issues found**: Report "No major code smells detected" but include suggestions for improvement
- **Too many issues**: Prioritize and group by category, focus on critical/high priority items
- **False positives**: Use `read_file` to verify context, only report confirmed issues
- **Type checking errors**: Report type errors as separate category, don't confuse with code smells

## Success Criteria

- [ ] Architecture violations identified with file/line citations
- [ ] TypeScript anti-patterns detected with examples
- [ ] Code duplication findings with specific locations
- [ ] Dead code identified with removal recommendations
- [ ] Performance anti-patterns found with fix suggestions
- [ ] Modernization opportunities identified with recommendations
- [ ] Outdated patterns flagged for refactoring
- [ ] Recommendations include breaking changes where appropriate
- [ ] Findings categorized by severity (Critical/High/Medium/Low)
- [ ] Actionable recommendations provided for each finding
- [ ] Evidence-based reporting with code citations
- [ ] Summary report with prioritized recommendations

## Output Format

Report findings in structured format:

### Code Smell Analysis Report

**Summary**:
- Total findings: [count]
- Critical: [count]
- High: [count]  
- Medium: [count]
- Low: [count]

**Critical Issues**:

1. **[Issue Category]**: [Brief description]
   - Location: `file.ts:line`
   - Problem: [Explanation with code citation]
   - Fix: [Recommendation with pattern reference]
   - Example:
   ```typescript
   // Bad code example
   ```
   ```typescript
   // Good code example
   ```

**High Priority Issues**:

[Same format as Critical]

**Medium Priority Issues**:

[Same format as Critical]

**Low Priority Issues**:

[Same format as Critical]

**Recommendations**:
- [Prioritized list of actionable next steps]
- [Suggested refactoring approach]
- [Links to relevant documentation or patterns]

**Next Steps**:
1. Address Critical issues first (architecture violations, type safety)
2. Fix High priority issues (duplication, performance)
3. Clean up Medium/Low issues as time permits
4. Consider creating a plan document for large refactorings

## Notes

- All findings must include file paths and line numbers
- Use "Prove Your Homework" principle: cite actual code, not descriptions
- Focus on maintainability and understandability
- Prioritize critical architecture violations over minor style issues
- Consider solo development context: prioritize type safety over perfection
- Balance thoroughness with actionability (don't overwhelm with minor issues)
- When reporting, show both the problematic code and suggested fix
- Group similar issues together to reduce noise
- Focus on patterns that affect codebase health, not just style preferences

