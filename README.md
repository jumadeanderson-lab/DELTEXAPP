DeltexAI Frontend — Comprehensive README

Overview

This repository contains the DeltexAI frontend: an Expo + React Native application redesigned into an enterprise-grade cybersecurity UI. The codebase was migrated from TypeScript to JavaScript/JSX to simplify local development and remove TypeScript build requirements.

What's in this README

- Project overview and important files
- Migration notes (TypeScript → JavaScript)
- Local setup & development workflow
- Editor configuration
- Troubleshooting & common issues
- Security / npm audit guidance
- Next steps and recommended improvements

Project structure (key folders)

- `src/` — Application source code
  - `src/app/` — Screens (routing): `index.jsx`, `explore.jsx`, `settings.jsx`, `_layout.jsx`
  - `src/components/` — Shared components and web-specific components
  - `src/components/ui/` — UI component library (buttons, cards, badges, stat cards, pricing, etc.)
  - `src/context/` — `subscription-context.jsx` (feature gating provider)
  - `src/constants/theme.js` — Design tokens (Colors, Spacing, Typography)
  - `src/hooks/` — `use-theme.js`, `use-feature-access.js`, `use-color-scheme.js`

What changed: TypeScript → JavaScript migration

- All source files in `src/` previously written in TypeScript (`.ts`, `.tsx`) were converted to JavaScript (`.js`, `.jsx`).
- Removed `tsconfig.json` and added `jsconfig.json` to preserve editor path aliases and JSX settings.
- Removed TypeScript-only syntax such as `type` declarations, `interface`, `as const`, and `export type` from source files.
- Updated imports and type assertions that caused editor errors (e.g., removed `as SubscriptionPlan` assertions).

Why the migration

- Your request was to remove TypeScript usage and continue development with plain JSX/JS to reduce build complexity.
- This should speed up onboarding for contributors who prefer JavaScript and avoid TypeScript toolchain issues in some environments.

Local setup (development)

1. Install dependencies

```bash
npm install
```

2. Start the Metro/Expo dev server

```bash
npx expo start
```

If you see a port conflict, pass a different port explicitly:

```bash
npx expo start --port 8082
```

3. Run on device/emulator

```bash
npm run android
npm run ios    # macOS only
npm run web
```

Editor configuration

- `jsconfig.json` is provided to keep `@/*` path aliases working in the editor and to enable JSX support. If your editor still shows TypeScript language-service errors, reload the window (VS Code: `Developer: Reload Window`).

Troubleshooting common issues

- "Module '.../skeleton' was resolved to '.../skeleton.jsx', but '--jsx' is not set": Ensure `jsconfig.json` is present and your editor is reloaded. The bundler (Metro) uses file extensions directly; this error comes from the editor's TypeScript language service and is resolved by `jsconfig.json`.
- Stale TypeScript syntax errors: run a grep across `src/` for leftover `type`, `interface`, `as const`, `: ` type annotations, and I will remove them. I already removed remaining occurrences.
- If bundler fails with module not found errors, check path aliases in `jsconfig.json` and import paths. Update `jsconfig.json` if you move files.

Security & npm audit

While migrating, `npm audit` reported several moderate vulnerabilities in transitive dependencies. I created a `package-lock.json` using `npm i --package-lock-only` so `npm audit` can run.

Options to address vulnerabilities:

1. Run a safe fix:

```bash
npm audit fix
```

2. Run forceful fix (may introduce breaking changes):

```bash
npm audit fix --force
```

If you want me to run the forceful fix, I can, but I will then test the app to ensure nothing breaks — Expo packages are sensitive to major upgrades.

Runtime validation performed

- Started the Expo dev server (Metro) locally on port 8082 to verify the app runs. Metro started successfully and served the app URL.

Remaining TODOs

- Run a full test on Android and iOS emulators and on web to verify runtime behavior across platforms.
- Optionally run `npm audit fix --force` and then test thoroughly for breaking changes.
- Update documentation and README references to `.tsx` to `.jsx` across the repo.

If you'd like me to proceed

- Run `npm audit fix --force` and then run the app to resolve any breakage.
- Or produce a targeted upgrade plan for vulnerable packages (safer).
- Or update all documentation references from `.tsx`/`.ts` to `.jsx`/`.js`.

Tell me which action you prefer and I'll execute it and report back with results.
# DELTEXAPP
