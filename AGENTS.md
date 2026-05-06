# AGENTS.md

## Cursor Cloud specific instructions

This is a personal portfolio and blog site built with **Astro v6** using **Bun** as the runtime and package manager.

### Quick reference

| Action | Command |
|--------|---------|
| Install deps | `bun install` |
| Dev server | `bun dev` (serves at `localhost:4321`) |
| Build | `bun build` |
| Type check | `bun astro check` |
| Preview prod build | `bun preview` |

### Notes

- The lockfile is `bun.lock`; always use `bun install` (not npm/yarn/pnpm).
- `@astrojs/check` and `typescript` are dev dependencies required for `bun astro check` to work non-interactively. They are already in `package.json`.
- There are no automated test suites in this project; `bun astro check` is the primary validation command.
- No external services, databases, Docker, or environment variables are needed.
- The dev server supports `--host 0.0.0.0` for external access if needed.
- Blog content lives in `src/content/blog/` as Markdown files with frontmatter (title, pubDate, description).
