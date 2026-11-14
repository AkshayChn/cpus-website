# Architecture

This document explains how the CPUS site works for someone who is comfortable
with programming but may not have worked with a modern front-end toolchain. It
describes the build model, the repository layout, and where each concern lives.

## 1. The one-paragraph version

Astro is a **static site generator**. `bun run build` runs a Node program that
reads Markdown files and `.astro` components, validates the content, renders
every route to HTML, optimises images, and writes a directory of plain files to
`dist/`. GitHub Pages serves that directory over HTTPS. There is no application
server at request time, no database, and no API. "Rendering" here means
rendering during the build, not per visitor.

## 2. What Astro is

Astro is a framework for content-driven websites. Its basic unit is the
`.astro` component, which looks like HTML with a TypeScript block at the top:

```astro
---
import { getArticles } from '../lib/content';

const articles = await getArticles();
---

<ul>
  {articles.map((article) => (
    <li><a href={`/articles/${article.id}/`}>{article.data.title}</a></li>
  ))}
</ul>
```

The block between the `---` fences is called **frontmatter**. It runs on the
server, at build time, in Node. The template below it is HTML with expressions
in `{}`. Those expressions are evaluated once during the build and become
static HTML. They do not ship to the browser as a template language.

Astro's defaults matter:

- **File-based routing.** A file in `src/pages/` becomes a URL.
- **Zero client JavaScript by default.** Astro emits HTML and CSS. Client code
  only exists where a `<script>` block or an interactive island is explicitly
  added.
- **Content collections.** Markdown files are loaded, typed, and validated
  against a schema.
- **Built-in asset pipeline.** Local images can be resized, converted, and
  emitted with content-hashed filenames.
- **Server-first rendering.** There is no virtual DOM and no hydration unless
  you opt in.

This is different from a single-page application (React, Vue, Svelte) where the
browser downloads a JavaScript app and renders the page client-side. It is also
different from a server-rendered framework such as Next.js, which can produce
static pages but normally carries a server/runtime and hydration model. This
site uses Astro's static output only.

Astro does support interactive "islands" and UI framework components. This
project does not use them. All interactivity is a handful of hand-written
TypeScript modules.

## 3. Build lifecycle

`bun run build` executes `astro build`. The important stages are:

1. **Load configuration.** `astro.config.ts` sets the canonical site URL
   (`https://channesh.org`), the base path (`/` by default), trailing-slash
   behaviour, the Markdown processor, and the Tailwind Vite plugin.
2. **Sync and validate content.** The content layer reads
   `src/content/articles`, `src/content/series`, and `src/content/pages`. Each
   entry's frontmatter is parsed and checked against the Zod schemas in
   `src/content.config.ts`. A missing required field, an invalid date, a bad tag
   format, or a reference to a non-existent series stops the build.
3. **Enumerate routes.** Astro walks `src/pages/`. Static routes render once.
   Dynamic routes such as `articles/[slug].astro` and `tags/[tag].astro` export
   `getStaticPaths()`, which returns the full list of `{ params, props }`
   combinations to render.
4. **Render each page.** The page's frontmatter runs on Node. It can call
   `getCollection`, `getEntry`, `render`, and the helpers in
   `src/lib/content.ts`. The returned data is interpolated into the template.
5. **Transform Markdown.** Article bodies go through remark and rehype.
   `rehype-slug` adds stable `id` attributes to headings (used by the table of
   contents). `src/lib/rehype-figure.ts` converts a standalone Markdown image
   into `<figure>` + optional `<figcaption>`.
6. **Process images.** `<Image>` from `astro:assets` reads the imported image,
   generates responsive widths, converts to WebP, and writes hashed files under
   `dist/_astro/`. The HTML gets a `srcset` and `sizes` attribute.
7. **Emit static output.** Every route becomes
   `dist/<route>/index.html`. CSS and the small client bundles are emitted with
   hashed names. Files in `public/` are copied verbatim.
8. **Deploy.** The GitHub Actions workflow uploads `dist/` as a Pages artifact.
   GitHub Pages serves it as static files.

You can inspect the result directly: after a build, open
`dist/articles/<slug>/index.html`. It is the exact HTML a visitor receives,
minus compression and CDN headers.

## 4. Rendering model

There are two execution environments to keep separate:

| Environment | When it runs | What runs there |
| --- | --- | --- |
| Node (build time) | Once per `bun run build` or dev request | Astro frontmatter, `getCollection`, `render`, TypeScript helpers |
| Browser (request time) | When a visitor loads a page | HTML, CSS, and the explicit `<script>` bundles |

Consequences:

- `Astro.props` is data passed from `getStaticPaths()` or a parent component.
  It is not a browser API.
- `Astro.url` and `Astro.site` are available during rendering and are used for
  canonical URLs and metadata.
- Template expressions such as `{article.data.title}` are resolved at build
  time. They are not reactive.
- `class:list` is an Astro helper that flattens conditional class names at build
  time.
- A `<script>` block in an `.astro` file is processed by Astro/Vite, bundled, and
  served to the browser. Add `is:inline` to leave a script untouched and inline
  it in the HTML. The only intentional inline script is the theme/bootstrap
  snippet in `src/layouts/BaseLayout.astro`, which must run before first paint
  to avoid a flash of the wrong theme.

## 5. Routing

Astro maps files to URLs:

| Source | URL |
| --- | --- |
| `src/pages/index.astro` | `/` |
| `src/pages/articles/index.astro` | `/articles/` |
| `src/pages/articles/[slug].astro` | `/articles/<slug>/` |
| `src/pages/series/index.astro` | `/series/` |
| `src/pages/series/[slug].astro` | `/series/<slug>/` |
| `src/pages/tags/index.astro` | `/tags/` |
| `src/pages/tags/[tag].astro` | `/tags/<tag>/` |
| `src/pages/about.astro` | `/about/` |
| `src/pages/contact.astro` | `/contact/` |
| `src/pages/donate.astro` | `/donate/` |
| `src/pages/resources.astro` | `/resources/` |
| `src/pages/404.astro` | `/404.html` |

Dynamic routes do not have a server to fall back on. `getStaticPaths()` must
return every page that should exist. In `articles/[slug].astro` it calls
`getArticles()` and maps each entry's `id` to a `slug` param. In
`tags/[tag].astro` it enumerates `getTags()`. A missing entry means a missing
page, not a 404 at request time.

`astro.config.ts` sets:

- `trailingSlash: 'always'` — canonical URLs end in `/`.
- `build.format: 'directory'` — `/articles/foo/` is written as
  `dist/articles/foo/index.html`.

Internal links go through `src/lib/url.ts`. It prefixes the configured base
path. The site currently builds at `/`, so the helper mostly returns paths
unchanged, but it keeps the code portable to a project-site preview under a
subpath.

## 6. Content model

Content collections are defined in `src/content.config.ts`:

| Collection | Location | Loader | ID |
| --- | --- | --- | --- |
| `articles` | `src/content/articles/**/index.md` | `glob` | Top-level folder name |
| `series` | `src/content/series/**/index.md` | `glob` | Top-level folder name |
| `pages` | `src/content/pages/**/*.md` | `glob` | File path without extension |

Each collection has a Zod schema. The schema is the contract: it validates types,
coerces dates, defaults `language` to `kn`, defaults `tags` to an empty array,
and checks that `series` and `parent` point at real series entries. The
`image()` helper validates image paths and returns metadata (width, height,
format) that the templates use to choose the cover treatment.

`src/lib/content.ts` is the query layer. It hides collection access and sorting:

- `getArticles()` — published articles, newest first.
- `getArticle(slug)` — one article.
- `getTags()` / `getArticlesByTag(tag)` — tag index and tag pages.
- `getSeries()` / `getSeriesBySlug()` / `getSeriesMap()` — series access.
- `getSeriesChildren(parent)` — yearly editions under a parent series.
- `getArticlesBySeries(series)` — reading order from `seriesOrder`, then oldest
  first.
- `getStartHereArticles(series)` — manual `startHere` picks.
- `getRelatedArticles(article)` — same-series first, then recent fallback.
- `readingTime(article)` — word count at 150 wpm for Kannada, 220 for English.
- `formatDate(date)` — `en-IN` date formatting in UTC.

Drafts are filtered out of production builds. In dev, `draft: true` entries are
visible so they can be previewed.

Markdown images with a title become semantic figures. This input:

```markdown
![A field of millet](fig-01.jpg "Millet at the edge of the field.")
```

becomes:

```html
<figure>
  <img src="..." alt="A field of millet" />
  <figcaption>Millet at the edge of the field.</figcaption>
</figure>
```

The transformation lives in `src/lib/rehype-figure.ts` and is registered in
`astro.config.ts`.

## 7. Styling

Tailwind CSS 4 is wired through the Vite plugin in `astro.config.ts`. There is
no `tailwind.config.js`; Tailwind 4 is configured in CSS.

`src/styles/global.css` is the single style entry point. It does four jobs:

1. Imports Tailwind: `@import 'tailwindcss';`
2. Declares design tokens as CSS custom properties on `:root` and overrides them
   under `[data-theme='dark']`.
3. Maps those tokens to Tailwind utility names with `@theme inline`, so
   components can write `bg-paper`, `text-ink`, `border-rule`, `text-accent`,
   `bg-header`, and so on.
4. Defines the article prose styles (`.prose-cpus`), the mobile sheet styles,
   print styles, and the sticky-footer layout.

The tokens are warm-paper editorial colours: `--paper`, `--surface`, `--ink`,
`--muted`, `--rule`, `--accent`, `--highlight`, plus the original site's yellow
header (`--header: #e8c751`). Dark mode swaps the same token names, so components
do not need theme-specific classes.

The dark variant is declared as:

```css
@custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
```

That lets `dark:` utilities respond to `data-theme` on `<html>` instead of only
the operating system preference.

Typography is deliberately split:

- English UI text uses the system sans stack (`--font-ui`).
- Kannada text uses a self-hosted Noto Serif Kannada subset (`--font-kn`),
  loaded from Fontsource with `unicode-range` limited to Kannada.
- Latin words inside Kannada article prose fall back to a Georgia-style serif
  (`--font-serif`), so both scripts share one reading texture.
- English article prose also uses the serif stack through `.prose-cpus`.

There is no component library. Components are small `.astro` files with Tailwind
utilities. The design is custom editorial work; a framework such as daisyUI would
add more overrides than it saves.

## 8. Client-side JavaScript

The site ships very little JavaScript. All of it is progressive enhancement:

| Module | Purpose |
| --- | --- |
| `src/scripts/theme.ts` | Toggle light/dark, persist `cpus-theme`, set `data-theme` on `<html>`, and update `aria-pressed`. |
| `src/scripts/banner.ts` | Dismiss the construction banner and persist `cpus-banner-dismissed-v1`. |
| `src/scripts/article.ts` | Reading progress (rAF-throttled scroll), active table-of-contents link, mobile reading bar visibility via `IntersectionObserver`, native `<dialog>` sheets, Web Share with clipboard fallback. |

The theme and banner bootstrap is an inline `is:inline` script in
`BaseLayout.astro`. It runs before the page paints, reads `localStorage`, and
sets `data-theme` and `data-banner-dismissed` on `<html>`. This prevents a flash
of the wrong theme. It is the one intentional exception to the "scripts live in
`src/scripts/`" rule.

Everything else (navigation, links, content, theme colours without JS) works
without JavaScript. The theme toggle, banner dismissal, mobile sheets, and share
button degrade gracefully.

## 9. Images and assets

Two kinds of assets exist:

- **Content images** live beside their Markdown file, for example
  `src/content/articles/lessons-from-soil/cover.jpg` and `fig-01.jpg`. They are
  referenced relatively in frontmatter or Markdown. `image()` validates them and
  `<Image>` optimises them. They are content, not public files.
- **Public files** live in `public/` and are copied verbatim to `dist/`. This is
  reserved for `CNAME`, `favicon.svg`, and `robots.txt`.

Astro generates responsive variants and hashes filenames, so images can be
cached forever. The lead image is eager; below-the-fold images are lazy. Width
and height metadata prevents layout shift.

Do not put article images in `public/`. That bypasses validation, resizing, and
cache-busting.

## 10. Deployment

The workflow is `.github/workflows/deploy.yml`:

1. Check out the repository.
2. Install Node 24 and Bun 1.4.4.
3. `bun install --frozen-lockfile`.
4. `bun run check`.
5. `bun run build`.
6. Upload `dist` with `actions/upload-pages-artifact`.
7. Deploy with `actions/deploy-pages`.

The Pages source must be set to **GitHub Actions** in the repository settings.
The custom domain is `channesh.org` (`public/CNAME`). The workflow uses the
built-in `GITHUB_TOKEN`; no personal token is stored in the repository.

Because the site is served from the domain root, `base` is `/`. The `BASE_PATH`
environment variable can override it for a project-site preview, but CI does not
set it.

GitHub Pages caches HTML for about ten minutes. A deploy can succeed while a
browser still shows the previous HTML. Hard refresh before debugging.

The site is intentionally `noindex`:
`BaseLayout.astro` emits `noindex, nofollow, noarchive, nosnippet`, and
`public/robots.txt` disallows all crawlers. Both must be removed at launch.

## 11. Where to change what

| Task | Files |
| --- | --- |
| Add or edit an article | `src/content/articles/<slug>/index.md` and images beside it |
| Add or edit a series | `src/content/series/<slug>/index.md` |
| Edit About or Resources prose | `src/content/pages/*.md` |
| Change nav, footer, contact, social, donation | `src/data/site.ts`, `src/components/Header.astro`, `src/components/Footer.astro` |
| Change colours, fonts, prose, dark mode | `src/styles/global.css` |
| Change the article reading layout | `src/pages/articles/[slug].astro`, `src/components/article/*`, `src/scripts/article.ts` |
| Change the homepage lead or grids | `src/pages/index.astro` |
| Change content queries or sorting | `src/lib/content.ts` |
| Change URL handling | `src/lib/url.ts` |
| Change Markdown rendering | `astro.config.ts`, `src/lib/rehype-figure.ts` |
| Change build or deployment | `astro.config.ts`, `.github/workflows/deploy.yml` |

## 12. Glossary

| Term | Meaning here |
| --- | --- |
| **Static site generation (SSG)** | Building all HTML files ahead of time; the host serves files, not a running app. |
| **Astro component** | A `.astro` file with a build-time frontmatter block and an HTML template. |
| **Frontmatter** | The TypeScript block between `---` fences, or the YAML metadata block at the top of a Markdown file. |
| **Collection** | A typed group of content entries, such as all articles. |
| **Schema** | A Zod validation contract for frontmatter. |
| **Slug** | The URL-safe identifier for an article or series; here, its folder name. |
| **Route** | A URL produced by a file in `src/pages/`. |
| **Dynamic route** | A route with `[param]` in the filename, expanded by `getStaticPaths()`. |
| **remark / rehype** | The Markdown parser and HTML transformer pipeline. |
| **Vite** | The bundler/dev server Astro uses under the hood. |
| **Hydration** | Making server-rendered HTML interactive in the browser. This site does not hydrate components. |
| **Island** | An explicitly interactive component embedded in an otherwise static page. Not used here. |
| **Base path** | The URL prefix the site is built under; `/` for the custom domain. |
| **Artifact** | The built `dist/` directory uploaded to GitHub Pages. |
