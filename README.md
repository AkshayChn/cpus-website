# CPUS website

The new website for the Center for Public Understanding of Science (CPUS).

This is a greenfield Astro site. The WordPress export in `work/` is reference
material only and is never committed.

## Requirements

- [Bun](https://bun.sh/) 1.4+
- Node.js 24 for the Astro build (Astro 7 requires Node >= 22.23.4)

## Development

```bash
bun install
bun run dev
```

Local site: `http://localhost:4321/`

Production: `https://channesh.org/`

## Build and preview

```bash
bun run build
bun run preview
```

Use Astro's Bun commands for local serving. Do **not** use
`python3 -m http.server` as a project server; that was only a one-off static
screenshot helper and bypasses Astro routing.

The site is served at `https://channesh.org/` from the domain root. The deploy
workflow builds with the default base path (`/`).

## Checks

```bash
bun run check
```

## Content

Articles live in `src/content/articles/<slug>/index.md`, with images beside
each article. Series live in `src/content/series/<slug>/index.md`. Static pages
live in `src/content/pages/`.

The content schema is defined in `src/content.config.ts`.
