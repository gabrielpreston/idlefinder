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

Before analyzing code, understand what patterns should be followed:

### Domain Primitives (Always Reuse)

**Core Value Objects** (from `src/lib/domain/valueObjects/`):
- **Identifier**: Use `Identifier.generate<T>()` or `Identifier.from<T>()` for all entity IDs
  - Type aliases: `OrganizationId`, `TaskInstanceId`, `AgentId`, `TaskArchetypeId`, etc.
- **Timestamp**: Use `Timestamp.now()` or `Timestamp.from()` for time values
  - Domain systems receive timestamps as parameters (never call `Date.now()`)
- **Duration**: Use `Duration.ofMinutes()`, `Duration.ofHours()`, `Duration.ofSeconds()` for time spans
- **ResourceBundle**: Use `ResourceBundle.fromArray()` or `ResourceBundle.empty()` for resource collections
- **ResourceUnit**: Use `new ResourceUnit(type, amount)` for individual resources
- **NumericStatMap**: Use for stat collections (ability mods, etc.)

**Design Rule**: Always use `.value` property when using value objects as Map/Set keys (JavaScript uses reference equality, not value equality).

### Systems Primitives (Compose, Don't Duplicate)

**Entity Pattern** (from `docs/current/08-systems-primitives-spec.md`):
- All entities have: `id`, `type`, `attributes`, `tags`, `state`, `timers`, `metadata`
- Core systems reason over `type`, `attributes`, `tags`, `state` - never special-case specific IDs
- Use existing entity patterns: `Organization`, `TaskInstance`, `AgentInstance`, `TaskArchetype`, `FacilityInstance`, `ProgressTrack`

**System Pattern Rules**:
- Pure functions: given inputs, produce outputs (no side effects)
- No dependencies on infrastructure (bus, UI, etc.)
- Deterministic: same inputs = same outputs
- Time passed as parameters (never call `Date.now()`)

### Architecture Principles

- **Domain Purity**: Domain entities/systems must not depend on infrastructure (bus, UI, etc.)
- **Value Object Immutability**: All value objects must be immutable
- **Entity Validation**: All entities must validate state in constructors
- **System Purity**: Systems must be pure functions (no side effects)
- **Repository Abstraction**: Data access through interfaces, not direct Prisma
- **Composition over Duplication**: Compose from primitives rather than creating duplicates

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
   - Use `read_file` to read architecture rules
     - Example: `read_file` with `target_file: ".cursor/rules/default-architecture.mdc"`
   - Use `read_file` to read TypeScript standards
     - Example: `read_file` with `target_file: ".cursor/rules/default-typescript-standards.mdc"`
   - Use `list_dir` to understand directory structure
     - Example: `list_dir` with `target_directory: "src/lib/domain"`

2. **Run static analysis tools**
   - Use `run_terminal_cmd` to run type checking
     - Command: `npm run type-check` with `is_background: false`
   - Use `run_terminal_cmd` to run linting
     - Command: `npm run lint` with `is_background: false`
   - Note: Tools like `grep` and `codebase_search` are available for pattern matching

### Phase 2: Pattern Detection

1. **Scan for architecture violations**
   - Use `grep` to find domain entities importing infrastructure
     - Example: `grep` with `pattern: "from.*\\$lib\\/stores|from.*\\$lib\\/app"` and `path: "src/lib/domain"`
   - Use `codebase_search` to find system impurities
     - Example: `codebase_search` with `query: "Where do domain systems use Date.now() or have side effects?"` and `target_directories: ["src/lib/domain/systems"]`
   - Use `grep` to find value objects used as Map/Set keys without `.value`
     - Example: `grep` with `pattern: "new Map.*Identifier[^.]|new Set.*Identifier[^.]"` and `path: "src"`
   - Use `grep` to find direct Prisma usage in domain
     - Example: `grep` with `pattern: "PrismaClient|@prisma/client"` and `path: "src/lib/domain"`

2. **Detect TypeScript anti-patterns**
   - Use `grep` to find `any` usage
     - Example: `grep` with `pattern: ": any[^A-Za-z]|: any$"` and `path: "src"`
   - Use `grep` to find `@ts-ignore` comments
     - Example: `grep` with `pattern: "@ts-ignore|@ts-expect-error"` and `path: "src"`
   - Use `grep` to find type assertions
     - Example: `grep` with `pattern: " as [A-Z]"` and `path: "src"`
   - Use `codebase_search` to find functions without return types
     - Example: `codebase_search` with `query: "What functions are missing return type annotations?"` and `target_directories: ["src/lib/domain"]`

3. **Find code duplication**
   - Use `codebase_search` to find duplicate patterns
     - Example: `codebase_search` with `query: "Are there duplicate value object implementations or similar validation logic?"` and `target_directories: ["src/lib/domain"]`
   - Use `grep` to find similar function signatures
     - Example: `grep` with `pattern: "function.*validate|function.*check"` and `path: "src"`

4. **Identify dead code**
   - Use `grep` to find commented-out code blocks
     - Example: `grep` with `pattern: "^\\s*//.*function|^\\s*//.*class|^\\s*//.*export"` and `path: "src"`
   - Use `codebase_search` to find potentially unused exports
     - Example: `codebase_search` with `query: "What exported functions or classes might never be imported?"` and `target_directories: []`
   - Use `grep` to find unreachable code
     - Example: `grep` with `pattern: "return.*return|throw.*return"` and `path: "src"`

5. **Check performance patterns**
   - Use `codebase_search` to find object creation in loops
     - Example: `codebase_search` with `query: "Where are objects created inside game loops or render functions?"` and `target_directories: ["src"]`
   - Use `grep` to find potential memory leaks
     - Example: `grep` with `pattern: "addEventListener"` and `path: "src"`
   - Use `codebase_search` to find inefficient algorithms
     - Example: `codebase_search` with `query: "Where are nested loops that could be optimized?"` and `target_directories: ["src"]`

6. **Check entity and value object patterns**
   - Use `grep` to find `Partial<T>` usage in entity constructors
     - Example: `grep` with `pattern: "Partial<"` and `path: "src/lib/domain/entities"`
   - Use `codebase_search` to find entities without validation
     - Example: `codebase_search` with `query: "Do all entities validate state in constructors?"` and `target_directories: ["src/lib/domain/entities"]`
   - Use `grep` to find mutable value objects
     - Example: `grep` with `pattern: "class.*ValueObject.*\\{[^}]*public.*=.*[^readonly]"` and `path: "src/lib/domain/valueObjects"`

7. **Check import organization**
   - Use `grep` to find import statements
     - Example: `grep` with `pattern: "^import"` and `path: "src/lib/domain"` and `output_mode: "files_with_matches"`
   - Use `read_file` to check import ordering in sample files
     - Example: `read_file` with `target_file: "src/lib/domain/systems/TaskResolutionSystem.ts"` and `offset: 1` and `limit: 30`

### Phase 3: Analysis and Reporting

1. **Categorize findings by severity**
   - **Critical**: Architecture violations, type safety issues, system impurities
   - **High**: Code duplication, missing tests for critical logic, performance issues
   - **Medium**: Naming violations, import organization, legacy patterns
   - **Low**: Minor code style issues, opportunities for modernization

2. **Provide evidence for each finding**
   - Use `read_file` to show specific code examples
     - Example: `read_file` with `target_file: "file.ts"` and `offset: line_number` and `limit: 10`
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

- **No issues found**: Report "No major code smells detected" but include suggestions for improvement
  - Detection: All grep/search queries return clean results
  - Resolution: Provide general recommendations and best practices reminder

- **Too many issues**: Prioritize and group by category
  - Detection: Hundreds of findings across multiple categories
  - Resolution: Group by category, focus on critical/high priority items, suggest phased approach

- **False positives**: Verify findings before reporting
  - Detection: Pattern match that may not be actual issue
  - Resolution: Use `read_file` to verify context, only report confirmed issues

- **Type checking errors**: Note existing type errors separately
  - Detection: `npm run type-check` returns errors
  - Resolution: Report type errors as separate category, don't confuse with code smells

## Success Criteria

- [ ] Architecture violations identified with file/line citations
- [ ] TypeScript anti-patterns detected with examples
- [ ] Code duplication findings with specific locations
- [ ] Dead code identified with removal recommendations
- [ ] Performance anti-patterns found with fix suggestions
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

