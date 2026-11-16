# CPUS website

The website for the Center for Public Understanding of Science (CPUS),
Bengaluru: <https://channesh.org/>.

This is a greenfield, static replacement for the old WordPress site at
<https://cfpus.org/>. Articles are written in Markdown, validated at build time,
and compiled to plain HTML, CSS, and optimised images. There is no application
server or database. Content can be edited through Sveltia CMS, a static admin
page that commits Markdown and images directly to GitHub.

> **Preview status.** The site is intentionally `noindex`, and
> `public/robots.txt` disallows crawling. Remove both only when the site is
> ready to launch.

## At a glance

- 11 published articles, 7 series, 21 tags
- Astro 7 static output, TypeScript, Tailwind CSS 4
- Bun 1.4.4 for install and scripts; Node 24 for Astro's build
- GitHub Actions builds and deploys to GitHub Pages on every push to `main`
- Sveltia CMS at `/admin/`: static, token-only, and commits content to Git; no
  CMS server or database
- No client-side framework; JavaScript is limited to the theme switch, the
  construction banner, and reading-page enhancements

## Stack

| Piece | What it does |
| --- | --- |
| [Astro](https://astro.build/) 7 | Static site generator. File-based routes, layouts, content collections, Markdown, and the image pipeline. |
| TypeScript | Every authored source file. Astro component frontmatter is TypeScript. |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Utility CSS through the Vite plugin, plus design tokens in `src/styles/global.css`. |
| [Bun](https://bun.sh/) 1.4.4 | Package manager, lockfile, and script runner. |
| Node 24 | Astro's build runtime. Astro 7 requires Node >= 22.23.4. |
| GitHub Actions + Pages | Build and deploy on every push to `main`; check pull requests. |
| [Sveltia CMS](https://sveltiacms.app/) 0.266.0 | Static admin page in `public/admin/`. Edits Markdown and images through the GitHub API; no server or database. |

There is deliberately no React, Vue, Svelte, daisyUI, or other component
framework. See `docs/architecture.md` for the reasoning and the build model.

## Quickstart

Requirements: Bun 1.4+ and Node 24 on `PATH`.

```bash
bun install
bun run dev
```

The dev server prints its URL, normally <http://localhost:4321/>. The content
editor is at <http://localhost:4321/admin/index.html>. In Chrome or Edge, use
**Work with Local Repository** to edit local files without a token. Firefox can
sign in with a token but cannot use the local repository workflow.

| Command | Purpose |
| --- | --- |
| `bun run dev` | Development server with hot reload. |
| `bun run build` | Production build into `dist/`. |
| `bun run preview` | Serve the built `dist/` locally. |
| `bun run check` | Astro and TypeScript diagnostics. CI runs this before building. |
| `bun run check:cms` | Validate the CMS config, content model, references, tags, and media paths. |
| `bun test` | Unit tests, including the Sveltia HTML-figure Markdown transform. |

Use Bun or Astro for local serving. Do **not** use `python3 -m http.server` as a
project server; it bypasses Astro routing and the build output conventions.

If the system Node is too old, put a Node 24 installation first on `PATH` for
the duration of the build.

## How the site is built

Astro compiles the whole site ahead of time:

1. Content collections load every Markdown file under `src/content/` and
   validate frontmatter with Zod (`src/content.config.ts`). An invalid date, tag,
   or series reference fails the build.
2. Every file in `src/pages/` becomes a route. Dynamic routes such as
   `articles/[slug].astro` call `getStaticPaths()` at build time to enumerate
   every article.
3. Page frontmatter runs on Node, queries content through `src/lib/content.ts`,
   and renders an HTML template.
4. Markdown is converted to HTML. `rehype-slug` adds heading IDs and
   `rehype-figure` turns a standalone image into `<figure>` + `<figcaption>`.
   `remark-html-figure` converts Sveltia's captioned-image HTML back into a
   Markdown image first, so Astro's image pipeline still applies.
5. `<Image>` from `astro:assets` emits responsive WebP variants with hashed
   filenames.
6. The result is a plain static directory in `dist/`. GitHub Pages serves it.
   There is no server runtime, database, or API at request time.

The full walkthrough is in `docs/architecture.md`. Authoring rules are in
`docs/content-guide.md`.

## Repository map

```text
.
├── astro.config.ts          # Site URL, base path, Markdown pipeline, Tailwind
├── src/
│   ├── pages/               # File-based routes (one file = one URL)
│   ├── layouts/             # Page shells; BaseLayout owns <html>, <head>, header, footer
│   ├── components/          # Reusable .astro components
│   │   └── article/         # Reading rail, mobile bar, end-of-article scroller
│   ├── content/             # Markdown articles, series, pages, and their images
│   ├── content.config.ts    # Zod schemas for the content collections
│   ├── lib/                 # Content queries, URL helper, rehype figure plugin
│   ├── data/site.ts         # Nav, footer, contact, social, donation details
│   ├── scripts/             # Small client-side TypeScript modules
│   └── styles/global.css    # Tailwind import, design tokens, prose, dark mode
├── public/                  # Copied verbatim: CNAME, favicon, robots.txt, admin/
├── docs/                    # Architecture and content guide
├── .github/workflows/       # Pull-request checks and GitHub Pages deployment
├── work/                    # Local notes and WordPress export (gitignored)
└── dist/                    # Build output (gitignored)
```

## Routes

| Route | Source | Purpose |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Homepage: newest-article lead, latest grid, series, About band |
| `/articles/` | `src/pages/articles/index.astro` | Full article archive |
| `/articles/<slug>/` | `src/pages/articles/[slug].astro` | Article reading page |
| `/series/` | `src/pages/series/index.astro` | All series |
| `/series/<slug>/` | `src/pages/series/[slug].astro` | Series hub with reading order |
| `/tags/` | `src/pages/tags/index.astro` | All tags with counts |
| `/tags/<tag>/` | `src/pages/tags/[tag].astro` | Articles for one tag |
| `/about/` | `src/pages/about.astro` | About CPUS |
| `/resources/` | `src/pages/resources.astro` | Publications and links |
| `/contact/` | `src/pages/contact.astro` | Contact details |
| `/donate/` | `src/pages/donate.astro` | Donation details |
| `/admin/` | `public/admin/index.html` | Sveltia CMS (noindex, not linked) |
| `/404.html` | `src/pages/404.astro` | Not found |

URLs always use a trailing slash. The build writes
`dist/<route>/index.html` because `trailingSlash: 'always'` and
`build.format: 'directory'` are set in `astro.config.ts`.

## Content

Content lives in `src/content/`:

- `articles/<slug>/index.md` — one folder per article. Images live beside the
  Markdown file and are referenced relatively.
- `series/<slug>/index.md` — series metadata and a short description.
- `pages/<slug>/index.md` — prose pages such as About and Resources. Page images
  live beside `index.md`.

Editors can use the CMS at `/admin/` instead of editing these files directly.
The CMS writes the same Markdown and image layout described below. See
`docs/content-guide.md` for the editor workflow and token requirements.

A minimal article looks like this:

```markdown
---
title: "Lessons from the soil"
summary: "A short standfirst derived from the article."
publishedAt: 2026-01-01
series: journey-with-plants
seriesOrder: 1
language: kn
author: CPUS
tags: [soil, agriculture, environment]
cover: ./cover.jpg
coverAlt: "A descriptive alt text for the cover image."
featured: false
draft: false
---

Body text starts here.
```

**Do not invent content.** Contact details, donation details, social links,
names, dates, and factual claims must come from the WordPress export or the live
`cfpus.org` site. Article summaries must be derived from the article text. The
bank account name is kept exactly as supplied by CPUS, including its spelling.

Tags are manual, lowercase, and URL-safe. Do not infer them from article text.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`:

1. Set up Node 24 and Bun 1.4.4.
2. `bun install --frozen-lockfile`
3. `bun run check:cms`
4. `bun test`
5. `bun run check`
6. `bun run build`
7. Upload `dist/` as the GitHub Pages artifact and deploy it.

`.github/workflows/check.yml` runs the same checks on pull requests. It does
not deploy. It also fails a pull request targeting `main` while the CMS
`backend.branch` is still `sveltia-cms`, so change that to `main` before merging
the integration branch.

The custom domain is `channesh.org`, stored in `public/CNAME`. Pages is served
from the domain root, so the default base path is `/`. `BASE_PATH` remains as an
override for project-site previews but is not set in CI.

Pages source must be **GitHub Actions** in the repository settings. The workflow
uses the built-in `GITHUB_TOKEN`; no personal token is needed.

GitHub Pages caches HTML for roughly ten minutes. If a deploy looks stale, hard
refresh before assuming the build failed.

## Documentation

| File | Audience | Contents |
| --- | --- | --- |
| `README.md` | Everyone | Overview, setup, commands, map, deployment |
| `docs/architecture.md` | Developers | Astro build lifecycle, routing, styling, client JS, CMS architecture |
| `docs/content-guide.md` | Editors and authors | CMS workflow, articles, frontmatter, images, series, tags |
| `AGENTS.md` | Local coding agents | Working rules and conventions (gitignored) |
| `work/` | Local only | Session notes, retro, WordPress export (gitignored) |

## Project rules

- Articles are the product. Keep the reading experience, series discovery,
  mobile usability, and performance first.
- Mobile-first. Test at 360 px, 390 px, tablet, and desktop widths.
- Dark mode is first-class. Theme state lives under `cpus-theme` and is applied
  through `data-theme` on `<html>`.
- Use the design tokens in `src/styles/global.css`; avoid hard-coded colours
  where a token exists.
- Kannada uses Noto Serif Kannada, generous line-height, left-aligned text, and
  no italics for emphasis. English UI uses the system sans stack. Latin words
  inside Kannada prose use the serif fallback.
- All authored code is TypeScript. No `.js` or `.mjs` source files. The vendored
  Sveltia runtime in `public/admin/vendor/` is a third-party asset, not authored
  project code.
- The CMS config (`public/admin/config.yml`) mirrors
  `src/content.config.ts`. Change both in the same commit when the content model
  changes.
- Never commit a personal access token. Editors keep their token in their own
  browser; the repository contains no credentials.
- No client-side framework and no component library on the public site. The
  `/admin/` page loads the third-party Sveltia runtime.
- The only raw inline script is the theme/banner bootstrap in
  `src/layouts/BaseLayout.astro`, which prevents a theme flash before paint.
- Keep `noindex` and the `robots.txt` disallow until launch.
- Do not touch the separate `akych.com` repository or its DNS.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Build fails with a Node version error | Astro needs Node >= 22.23.4; use Node 24. |
| Content validation error | Frontmatter does not match `src/content.config.ts`; read the file and field in the error. |
| A series link is broken | `series:` must match the folder name under `src/content/series/`. |
| A tag page is missing | Tags are generated from published articles; add the tag to at least one article. |
| The site looks old after a deploy | GitHub Pages caches HTML; hard refresh. |
| Fonts look wrong | Kannada uses the Noto Serif Kannada subset; Latin prose uses the Georgia fallback, not a webfont. |
| CMS sign-in fails with a fine-grained token | The repository is owned by a personal account and you are an outside collaborator | Move the repository to a GitHub organization and join it as a member. |
| CMS save fails with “Resource not accessible by personal access token” | The token lacks Contents write (or Pull requests write for the editorial workflow) | Edit or recreate the token with the required permissions. |
| A CMS image is missing after save | The upload went to the wrong folder or the Markdown path is wrong | Keep content images beside the entry's `index.md` and reference them relatively. |
