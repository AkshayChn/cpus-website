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

## Build

```bash
bun run build
bun run preview
```

The GitHub Pages preview is served from `/cpus-website/`. The deploy workflow
sets `BASE_PATH=/cpus-website`; local development uses `/`.

## Content

Articles live in `src/content/articles/<slug>/index.md`, with images beside
each article. Series live in `src/content/series/<slug>/index.md`. Static pages
live in `src/content/pages/`.

The content schema is defined in `src/content.config.ts`.
