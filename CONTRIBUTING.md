# Contributing to Cluttered

Thank you for your interest in contributing to Cluttered! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Adding a New Ecosystem](#adding-a-new-ecosystem)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Style Guide](#style-guide)

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to make a great tool for developers.

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm
- Git
- macOS (for testing the full app)

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/cluttered.git
   cd cluttered
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run in development mode**

   ```bash
   pnpm dev
   ```

   This starts both the Vite dev server (renderer) and builds the main process.

4. **Make your changes**

5. **Test your changes**

   ```bash
   # Type checking
   pnpm typecheck

   # Build to ensure everything compiles
   pnpm build
   ```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

### Commit Messages

Use clear, descriptive commit messages:

```
type: short description

Longer description if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Adding a New Ecosystem

To add support for a new development ecosystem:

1. **Create the plugin file**

   Create `src/main/ecosystems/plugins/your-ecosystem.ts`:

   ```typescript
   import { BaseEcosystemPlugin } from '../base';

   export class YourEcosystemPlugin extends BaseEcosystemPlugin {
     id = 'your-ecosystem';
     name = 'Your Ecosystem';
     icon = '📦'; // Choose an appropriate emoji
     color = '#HEXCOLOR';

     // Files that identify this type of project
     detectionFiles = ['your-config-file.json'];

     // Directories/files that can be safely deleted
     cleanablePatterns = [
       {
         pattern: 'your_deps_folder',
         description: 'Dependencies',
         alwaysSafe: true,
       },
       {
         pattern: 'build',
         description: 'Build output',
         alwaysSafe: true,
       },
     ];
   }

   export const yourEcosystemPlugin = new YourEcosystemPlugin();
   ```

2. **Register the plugin**

   In `src/main/ecosystems/index.ts`:

   ```typescript
   import { yourEcosystemPlugin } from './plugins/your-ecosystem';

   // Add to the registration section
   ecosystemRegistry.register(yourEcosystemPlugin);
   ```

3. **Add types**

   In `src/shared/types.ts`, add your ecosystem to the `EcosystemId` type.

4. **Add default settings**

   In the `defaultSettings` object, add your ecosystem to `ecosystems.enabled`.

5. **Add renderer config**

   In `src/renderer/config/ecosystems.ts`, add the display configuration.

6. **Test thoroughly**

   - Verify detection works correctly
   - Ensure only safe directories are marked for cleaning
   - Test the size calculation
   - Verify cleaning actually works

## Submitting a Pull Request

1. **Ensure your code compiles**

   ```bash
   pnpm build
   ```

2. **Update documentation if needed**

   - Update README.md if adding features
   - Update ARCHITECTURE.md for structural changes

3. **Create the PR**

   - Use a descriptive title
   - Fill out the PR template
   - Link any related issues

4. **Respond to review feedback**

   We may request changes before merging.

## Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

### React

- Functional components only
- Use hooks for state and effects
- Keep components focused and small
- Use Zustand for global state

### File Organization

```
src/
├── main/           # Electron main process only
├── renderer/       # React UI only
└── shared/         # Types shared between both
```

### Naming Conventions

- Files: `camelCase.ts` or `PascalCase.tsx` (components)
- Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing!
