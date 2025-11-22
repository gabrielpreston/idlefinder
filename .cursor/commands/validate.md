# Run Solo Development Validation

## Overview
Execute solo development validation suite focusing on type checking, basic functionality, and workflow best practices

## Steps

## Building Block Validation

See `.cursor/rules/default-building-blocks.mdc` for complete building block reference.

Before validating code, check for proper use of reusable building blocks:
- **Domain primitive reuse**: Verify code uses existing Identifier, Timestamp, Duration, ResourceBundle
- **Entity pattern consistency**: Ensure entities follow existing patterns (constructor-based, validation)
- **System reuse**: Verify systems follow existing patterns (pure functions, no side effects)
- **Systems primitives vocabulary**: Verify solution uses existing primitives vocabulary

## NPM Scripts for Validation

See `.cursor/rules/default-development-workflow.mdc#npm-script-reference` for complete npm script reference.
See `.cursor/rules/default-tool-usage.mdc#npm-script-validation` for validation sequence pattern.
See `.cursor/rules/default-principles.mdc` for DRY and First Principles guidance.

Key validation scripts:
- **`npm run type-check`** - Run TypeScript type checking (`tsc --noEmit`)
- **`npm run lint`** - Run ESLint (validation only, no fixes)
- **`npm run lint -- --fix`** - Run ESLint with auto-fix
- **`npm test`** - Run test suite

- **Run type checking**
  - Execute `npm run type-check` to check for type errors
  - Focus on TypeScript strict mode compliance
  - Identify any missing type annotations
- **Run basic tests**
  - Execute `npm test` to run the test suite
  - Focus on smoke tests and basic functionality
  - Identify any test failures
- **Check game functionality**
  - Use `npm run dev` to start development server
  - Play the game and verify functionality
  - Verify game starts and plays correctly
- **Validate workflow patterns**
  - Check for proper npm script usage
  - Verify TypeScript configuration is correct
  - Confirm test configuration is appropriate
- **Report findings**
  - Categorize issues by priority: type errors, test failures, game issues
  - Provide specific recommendations for fixes
  - Focus on solo development priorities (type checking over performance optimization)
