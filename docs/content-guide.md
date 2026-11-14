# Content guide

This guide is for adding and editing content. The content is plain Markdown plus
a small YAML frontmatter block. The build validates the block, so most mistakes
are caught before anything is deployed.

## Add an article

1. Pick a slug. It is lowercase ASCII, hyphenated, descriptive, and has no date:
   `lessons-from-soil`, `nobel-2026-physics`, `robert-weinberg`.
2. Create the folder and file:
   `src/content/articles/<slug>/index.md`.
3. Put the cover and body images in the same folder. Reference them relatively:
   `./cover.jpg`, `fig-01.jpg`.
4. Fill in the frontmatter (see the reference below).
5. Write the body in Markdown. Use `##` and `###` headings; the article page
   builds its table of contents from them.
6. Add manual tags. Reuse existing tags where possible.
7. If the article belongs to a series, set `series` and `seriesOrder`.
8. Run `bun run dev` and check the page, then run `bun run check` and
   `bun run build` before committing.

A complete example:

```markdown
---
title: "Lessons from the soil"
summary: "A standfirst derived from the article, not written from assumption."
publishedAt: 2026-01-01
updatedAt: 2026-01-05
series: journey-with-plants
seriesOrder: 1
language: kn
author: CPUS
tags: [soil, agriculture, environment]
cover: ./cover.jpg
coverAlt: "A descriptive alt text for the cover image."
coverStyle: hero
featured: false
draft: false
---

Body text starts here.

## A section heading

![A field of millet](fig-01.jpg "Millet at the edge of the field.")
```

The folder name is the URL slug and the collection ID. Do not add a separate
`slug` field, and do not rename an article folder after publishing unless you
intend to break the old URL.

## Article frontmatter

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `title` | Yes | string | Displayed as the article title. |
| `summary` | Yes | string | Standfirst. Derive it from the article text. |
| `publishedAt` | Yes | date | `YYYY-MM-DD`; used for sorting and display. |
| `updatedAt` | No | date | Shows an "Updated" date on the article page. |
| `series` | No | series slug | Must match a folder under `src/content/series/`. |
| `seriesOrder` | No | number | Reading order inside the series. Lower comes first. |
| `language` | No | `kn` or `en` | Defaults to `kn`. Controls typography and reading speed. |
| `author` | No | string | Defaults to `CPUS`. |
| `tags` | No | string array | Lowercase, hyphenated, URL-safe. Defaults to `[]`. |
| `cover` | No | image path | Usually `./cover.jpg`, beside `index.md`. |
| `coverAlt` | No | string | Alt text for the cover. Also shown as a caption on plate covers. |
| `coverStyle` | No | `hero` or `plate` | Optional override for the cover layout. |
| `featured` | No | boolean | Defaults to `false`. The homepage currently falls back to the newest article as lead. |
| `draft` | No | boolean | Defaults to `false`. Drafts are hidden in production. |

## Series frontmatter

Series live in `src/content/series/<slug>/index.md`.

```yaml
---
title: "Journey with Plants"
titleKn: "ಸಸ್ಯಯಾನ"
description: "A short description of the series."
cover: ./cover.jpg
order: 1
featured: true
parent: nobel
startHere: [lessons-from-soil, tomato]
draft: false
---
```

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `title` | Yes | string | English title. |
| `titleKn` | No | string | Kannada title, shown on the series page. |
| `description` | Yes | string | Short description for cards and the series header. |
| `cover` | No | image path | Series card and header image. |
| `order` | No | number | Sort order on `/series/`. Defaults to `0`. |
| `featured` | No | boolean | Shows the series on the homepage. Defaults to `false`. |
| `parent` | No | series slug | Makes this a child series, e.g. a yearly Nobel edition. |
| `startHere` | No | string array | Manually curated article slugs for the "Start here" block. |
| `draft` | No | boolean | Defaults to `false`. |

The series page shows "Start here" only when there are curated picks and other
articles remain. Reading order comes from `seriesOrder`, then oldest first.
Child series articles are included in the parent series count and listing.

## Page frontmatter

Static prose pages live in `src/content/pages/*.md` and are rendered by
`src/pages/about.astro` and `src/pages/resources.astro`.

```yaml
---
title: "About CPUS"
description: "A short description for metadata and the page header."
updatedAt: 2026-01-01
draft: false
---
```

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `title` | Yes | string | Page heading and title tag. |
| `description` | No | string | Meta description and page standfirst. |
| `updatedAt` | No | date | Optional update date. |
| `draft` | No | boolean | Defaults to `false`. |

## Images

All article and series images live beside their Markdown file. Do not put
content images in `public/`; that bypasses validation, resizing, and hashed
filenames.

### Covers

Use `cover: ./cover.jpg`. A wide landscape image works best as a hero. The
article page automatically uses the framed **plate** treatment when the cover is:

- portrait (taller than wide), or
- narrower than 700 px.

Composite, graphic, or low-resolution covers should set `coverStyle: plate`
explicitly so they are not stretched into a 16:9 hero.

`coverAlt` is required in practice: it is the accessible name of the cover and
the caption under plate covers. Describe the image, not the article.

### Body images

Use normal Markdown:

```markdown
![Alt text](fig-01.jpg)
![Alt text](fig-01.jpg "Optional caption")
```

An image alone on its line becomes a `<figure>`. If the Markdown title is
present, it becomes the `<figcaption>`. The `alt` text is required for
accessibility; the caption is optional editorial context.

Prefer local `.jpg`, `.jpeg`, `.png`, or `.webp` files. Astro generates
responsive WebP variants at build time. Remote images bypass the pipeline and
should be avoided unless there is a reason to hotlink.

## Tags

Tags are **manual**. Do not infer them from the article text, and do not add a
tag that only appears in a throwaway sentence.

Rules:

- Lowercase ASCII letters, digits, and hyphens only.
- Match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- No spaces, uppercase, underscores, or leading/trailing hyphens.
- Reuse existing tags where they fit. The full list is at `/tags/`.

Examples: `science-history`, `nobel`, `climate`, `public-health`.

Tags are collected from published articles. A tag page exists only if at least
one published article uses that tag.

## Series and reading order

Set `series` to the series folder name. The build validates the reference.

`seriesOrder` controls reading order. If it is omitted, the article falls to the
end of the series and sorts by publication date. This matters for series where
publication order and reading order differ.

`startHere` is a manual list of article slugs for the series landing page. It is
not inferred. Use it when a newcomer should read a specific piece first.

## Drafts and preview

Set `draft: true` to keep an article out of production. Drafts are visible in
`bun run dev`, so they can be reviewed locally. They are excluded from lists,
tag counts, series pages, and `getStaticPaths()` in a production build.

## Content integrity

This site is a replacement for a real publication. Do not invent facts or copy.

- Contact details, donation details, social links, names, dates, and factual
  claims must come from the WordPress export in `work/` or the live
  `https://cfpus.org/` site.
- Article summaries must be derived from the article text.
- If a detail is uncertain, use an explicit placeholder or ask. Do not guess.
- The bank account name is intentionally `Centre for Public Understanding of
  Sceince`; keep the spelling exactly as supplied by CPUS.
- Body-image alt text still needs a human editorial pass on some migrated
  articles. Do not treat the current alt text as final.

The WordPress export and `work/` are local reference material and are never
committed.

## Publishing checklist

- [ ] Slug is lowercase, hyphenated, and has no date.
- [ ] Frontmatter matches the schema.
- [ ] Summary is derived from the article.
- [ ] Tags are manual, lowercase, and URL-safe.
- [ ] Series slug exists, and `seriesOrder` is correct.
- [ ] Cover exists, has `coverAlt`, and uses the right `coverStyle`.
- [ ] Body images have alt text and useful captions.
- [ ] `bun run check` passes.
- [ ] `bun run build` passes.
- [ ] Article renders at 360 px, 390 px, tablet, and desktop.
- [ ] Internal links are valid.
- [ ] No invented names, dates, contact details, or donation details.

## Common failures

| Error | Cause | Fix |
| --- | --- | --- |
| `title: Required` or similar | Missing required frontmatter | Add the field. |
| Invalid date | `publishedAt` is not a date | Use `YYYY-MM-DD`. |
| Invalid tag | Uppercase, space, underscore, or empty segment | Use lowercase and hyphens. |
| Unknown series reference | `series` does not match a series folder | Create the series or correct the slug. |
| Image not found | Wrong relative path or missing file | Keep images beside `index.md` and use `./name.jpg`. |
| Missing tag page | No published article uses the tag | Add the tag to an article. |
| Article missing from production | `draft: true` | Set `draft: false`. |
