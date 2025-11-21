# Prove Your Homework - Validate AI claims with evidence

## Purpose

Force validation of AI assertions by requiring evidence-based citations for all claims. Verify that AI-generated code, plans, or analysis includes proper evidence and code references.

## When to Use

Use this command when:

- AI claims to follow existing patterns but doesn't cite examples
- AI describes integration points without showing actual code
- AI makes architectural decisions without referencing existing patterns
- AI proposes optimizations without demonstrating improvements
- You need to verify assumptions before accepting AI-generated code
- AI makes assertions about codebase state without evidence

## Prerequisites

Before executing this command, ensure:

- AI response or claim to validate is available
- Access to codebase for verification
- Ability to search code and read files

## AI Execution Steps

### Phase 1: Identify Unsubstantiated Claims

1. **Review AI response for assertions**
   - Identify phrases like "follows existing patterns", "integrates with X", "improves performance"
   - Note architectural or design decisions made without code references
   - Identify claims about codebase state, dependencies, or configurations
   - Look for claims about patterns, integrations, performance, architecture, or codebase state

2. **Categorize claims by type**
   - Pattern Claims: "follows existing pattern X"
   - Integration Claims: "integrates with component Y"
   - Performance Claims: "improves performance by Z"
   - Architecture Claims: "follows architectural decision A"
   - Codebase State Claims: "configuration B exists"
   - Dependency Claims: "uses dependency C"

### Phase 2: Request and Gather Evidence

See `.cursor/rules/default-tool-usage.mdc` for tool usage patterns.

1. **For Pattern Claims**: Use `grep`, `codebase_search`, and `read_file` to find and verify patterns
2. **For Integration Claims**: Use `codebase_search` and `grep` to find integration points
3. **For Performance Claims**: Use `codebase_search` and `grep` to find performance-related code
4. **For Architecture Claims**: Use `codebase_search`, `read_file`, and `grep` to find architectural patterns
5. **For Codebase State Claims**: Use `read_file` and `grep` to check configuration files
6. **For Dependency Claims**: Use `read_file`, `grep`, and `codebase_search` to find dependency usage
7. **For Building Block Reuse Claims** (see `.cursor/rules/default-building-blocks.mdc`): Verify building blocks exist and are reused
8. **For Modernization Claims** (see `.cursor/rules/default-building-blocks.mdc#breaking-changes`): Verify modernization opportunities and breaking changes are acceptable

### Phase 3: Validate Evidence

1. **Verify cited code exists**
   - Use `read_file` to verify file paths are correct
     - Example: `read_file` with `target_file: "claimed-file-path.ts"`
   - Use `grep` to verify line numbers are accurate
     - Example: `grep` with `pattern: "pattern"` and `path: "file.ts"` and `output_mode: "content"` and `-n: true`

2. **Check evidence matches claim**
   - Use `read_file` to read code at cited locations
     - Example: `read_file` with `target_file: "file.ts"` and `offset: start_line` and `limit: end_line - start_line`
   - Verify code actually demonstrates the claimed pattern or integration
   - Cross-reference multiple sources when possible

3. **Validate integration points**
   - Use `codebase_search` to verify integration is correctly identified
     - Example: `codebase_search` with `query: "How do [component1] and [component2] interact?"` and `target_directories: ["src"]`
   - Use `grep` to find actual integration code
     - Example: `grep` with `pattern: "component1.*component2|component2.*component1"` and `path: "src"`

4. **Confirm patterns match implementation**
   - Use `read_file` to compare claimed pattern with actual code
     - Example: `read_file` with `target_file: "file-with-pattern.ts"`
   - Use `codebase_search` to find other examples of pattern
     - Example: `codebase_search` with `query: "Where else is [pattern] used?"` and `target_directories: ["src"]`

5. **Ensure architectural alignment**
   - Use `read_file` to review architecture documentation
     - Example: `read_file` with `target_file: "docs/ARCHITECTURE.md"`
   - Use `codebase_search` to verify architectural decisions
     - Example: `codebase_search` with `query: "What architectural patterns are documented?"` and `target_directories: ["docs"]`

### Phase 4: Report Findings

1. **List validated claims with evidence**
   - For each validated claim, provide:
     - File paths (e.g., `src/file.ts`)
     - Line number ranges (e.g., `12:45:src/file.ts`)
     - Code snippets demonstrating the claim
     - Multiple examples if pattern is "used throughout"

2. **Identify unsubstantiated claims**
   - List claims that cannot be substantiated
   - Explain why evidence is missing
   - Recommend corrections or removal

3. **Provide confidence scores**
   - Rate evidence quality (High/Medium/Low)
   - Provide confidence score for each claim based on evidence quality
   - Note any discrepancies between claims and actual codebase state

4. **Recommend corrections**
   - For unsubstantiated claims, recommend:
     - Removing the claim if it cannot be verified
     - Correcting the claim with accurate information
     - Adding proper evidence citations

## Error Handling

See `.cursor/rules/default-error-handling.mdc` for common error patterns.

Command-specific errors:
- **File not found**: Mark claim as unsubstantiated, note file doesn't exist
- **Line numbers incorrect**: Mark claim as incorrect, provide correct line numbers if pattern exists elsewhere
- **Pattern not found**: Mark claim as unsubstantiated, recommend removing or correcting
- **Integration not found**: Mark claim as unsubstantiated, verify components exist separately

## Success Criteria

- [ ] All claims in AI response identified and categorized
- [ ] Evidence gathered for each claim using appropriate tools
- [ ] Evidence validated against actual codebase
- [ ] Validated claims listed with file paths and line numbers
- [ ] Unsubstantiated claims identified with explanations
- [ ] Confidence scores provided for each claim
- [ ] Recommendations provided for corrections

## Output Format

Evidence report with:

- **Validated Claims** section:
  - Each claim with file path, line numbers, and code snippet
  - Confidence score (High/Medium/Low)
- **Unsubstantiated Claims** section:
  - Each unsubstantiated claim with explanation
  - Recommendation for correction
- **Summary**:
  - Total claims reviewed
  - Number validated vs unsubstantiated
  - Overall confidence in AI response

## Notes

- Always use `grep` and `codebase_search` to verify claims, never assume
- Require file paths and line numbers for all validated claims
- Cross-reference multiple sources when possible
- Provide code snippets, not just descriptions
- Use "prove your homework" principle: require evidence for all assertions
- Example: If AI says "follows existing pattern", show specific file and line numbers where pattern exists
