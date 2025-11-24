# Repository Guidelines

## Project Structure & Module Organization

- `src/routes`: Svelte pages and layouts using SvelteKit's filesystem routing (e.g., `+page.svelte`, `+layout.svelte`).
- `src/lib`: Shared UI and utilities such as `shuffle.ts`; import with SvelteKit aliases like `$lib/shuffle`.
- `static`: Public assets served as-is at the site root.
- `docs`: Supporting docs (e.g., `docs/design.md`) that capture design decisions.
- `app.html` and `app.d.ts` live at `src/` for app shell and type support.

## Build, Test, and Development Commands

- `pnpm install`: Install dependencies (pnpm is recommended because the lockfile is pnpm-generated).
- `pnpm dev`: Run the Vite dev server; add `--open` to auto-launch the browser.
- `pnpm build`: Create a production build.
- `pnpm preview`: Preview the production build locally.
- `pnpm check`: Sync SvelteKit and run `svelte-check` against `tsconfig.json` for type and Svelte diagnostics.
- `pnpm prepare`: Keeps SvelteKit types in sync; runs automatically on install hooks.

## Coding Style & Naming Conventions

- Use TypeScript where possible; keep functions typed (`shuffle` is a template for generics).
- Svelte files: prefer PascalCase for components, keep route files with `+page/+layout` naming, and colocate supporting modules under `src/lib`.
- Indentation follows the template defaults (tabs in existing files); keep imports ordered by standard library, external, then local.
- Keep styles scoped within Svelte components unless intentionally global.
- Favor small pure utilities in `src/lib`, and export through `src/lib/index.ts` when shared.

## Testing Guidelines

- Primary gate today is `pnpm check`; run it before pushing.
- No dedicated unit/e2e harness is present yet; when adding one, prefer colocated `*.spec.ts`/`*.test.ts` near the code or in `src/lib/__tests__`.
- For interactive changes, sanity-check via `pnpm preview` to catch routing or asset issues.

## Commit & Pull Request Guidelines

- Use clear, present-tense commit subjects; Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) are preferred for clarity.
- Keep commits focused (one logical change); include rationale in the body when behavior shifts.
- PRs should include: what changed, why, how to verify (commands run), and screenshots for UI-visible updates.
- Link issues or tasks when applicable; call out breaking changes or manual migration steps explicitly.
