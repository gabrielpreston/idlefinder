# Run Solo Development Validation

## Overview
Execute solo development validation suite focusing on type checking, basic functionality, and workflow best practices

## Steps

## Building Block Validation

Before validating code, check for proper use of reusable building blocks:

- **Check for domain primitive reuse**
  - Verify code uses existing Identifier, Timestamp, Duration, ResourceBundle
  - Check that new value objects aren't duplicating existing primitives
  - Validate Map/Set keys use `.value` property for value objects
- **Verify entity pattern consistency**
  - Ensure new entities follow existing entity patterns (constructor-based, validation)
  - Check that entities compose from existing value objects
  - Verify entities follow systems primitives pattern (id, type, attributes, tags, state, timers)
- **Validate system reuse**
  - Verify new systems follow existing system patterns (pure functions, no side effects)
  - Check that business logic uses existing systems rather than duplicating
  - Ensure systems don't depend on infrastructure (bus, UI, etc.)
- **Check systems primitives vocabulary**
  - Verify solution uses existing primitives (Entities → Attributes → Tags → State/Timers → Resources → Requirements → Actions → Effects → Events)
  - Check that new features compose from primitives rather than creating new fundamental types

## NPM Scripts for Validation

The following npm scripts are available for validation:

### Full Validation Suite

- **`npm run type-check`** - Run TypeScript type checking (`tsc --noEmit`)
- **`npm run lint`** - Run ESLint (validation only, no fixes)
- **`npm test`** - Run test suite

### Linting and Code Quality

- **`npm run lint`** - Run ESLint (validation only, no fixes)
- **`npm run lint -- --fix`** - Run ESLint with auto-fix
- **`npm run format`** - Format code with Prettier
- **`npm run type-check`** - Check TypeScript types (`tsc --noEmit`)

### Testing

- **`npm test`** - Run all available tests
- **`npm test -- --watch`** - Run tests in watch mode
- **`npm test -- --coverage`** - Run tests with coverage report
- **`npm test -- Game.test.ts`** - Run specific test file
- **`npm test -- -t "should update wave timer"`** - Run tests matching pattern

### Validation Workflow

1. **Quick validation**: `npm run lint` and `npm test` for fast feedback
2. **Pre-commit validation**: `npm run type-check && npm run lint && npm test` for comprehensive check
3. **Auto-fix issues**: `npm run lint -- --fix` to apply automatic fixes before re-running validation

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
