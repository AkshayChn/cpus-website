# Data model

This is the field-by-field reference for the content collections. It describes
what the build accepts, what the CMS writes, and where every file lives.

The two canonical files are:

- `src/content.config.ts` — Astro collections and Zod schemas.
- `public/admin/config.yml` — Sveltia CMS fields, widgets, and validation.

`scripts/check-cms-model.ts` cross-checks the two, plus the content tree. If you
change a field, change all three and update this document in the same commit.

## Layout

Every entry is a page bundle: a folder whose name is the slug, containing
`index.md` and any local images.

```text
src/content/
├── articles/
│   ├── tomato/
│   │   ├── index.md
│   │   ├── cover.jpg
│   │   └── fig-01.jpg
│   └── nobel-2026-physics/
│       ├── index.md
│       └── cover.jpg
├── series/
│   └── journey-with-plants/
│       ├── index.md
│       └── cover.jpg
└── pages/
    ├── about/
    │   └── index.md
    └── resources/
        ├── index.md
        └── fig-01.jpg
```

Rules:

- All three collections use `**/index.md` and derive the entry ID from the
  top-level folder name (`generateId: entry.split('/')[0]`).
- Never put a loose `.md` file directly in a collection folder. It will not be
  loaded, and `bun run check:cms` reports it.
- Do not add a `slug` frontmatter field. The folder name is the slug and the ID.
- Do not put content images in `public/`. They bypass validation and the image
  pipeline.

## Collection map

| Collection | Folder pattern | Entry ID | URL |
| --- | --- | --- | --- |
| `articles` | `src/content/articles/<slug>/index.md` | Folder name | `/articles/<slug>/` |
| `series` | `src/content/series/<slug>/index.md` | Folder name | `/series/<slug>/` |
| `pages` | `src/content/pages/<slug>/index.md` | Folder name | Fixed route, currently `/about/` or `/resources/` |

Article and series URLs are generated from the folder name. Page URLs are not:
`src/pages/about.astro` and `src/pages/resources.astro` call
`getEntry('pages', '<slug>')` with a fixed slug. Contact and Donate are
code-only routes and are not in the `pages` collection.

## Common rules

### Slugs

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Lowercase ASCII letters, digits, and single hyphens. No uppercase, spaces,
underscores, leading/trailing hyphens, or Kannada characters. The CMS enforces
this on create; `bun run check:cms` enforces it on the existing tree.

Slugs are editable only while creating an entry in the CMS. They cannot be
changed later, because that would change the URL. Renaming a published folder is
a deliberate redirect/URL decision, not routine editing.

### Dates

Use `YYYY-MM-DD`. Astro coerces the frontmatter value to a `Date`, and the
templates format it in UTC. Date-time values are technically accepted, but the
site is editorial and date-only is the convention.

### Drafts

`draft: true` hides articles and series from production lists, tag counts,
series pages, and generated routes. Drafts remain visible in `bun run dev` for
review.

> **Page limitation.** The page schema and CMS include `draft`, but the fixed
> `about.astro` and `resources.astro` routes currently call `getEntry` directly
> and do not filter it. Do not rely on `draft` to hide a page yet. Keep pages
> unpublished by not merging them, or remove the route until the page is ready.

### Images

The `image()` schema helper validates the path and exposes `src`, `width`,
`height`, and `format` to the templates. Astro emits responsive WebP variants
with hashed filenames.

- Covers and body images live beside the entry's `index.md`.
- Reference them relatively: `cover: ./cover.jpg`, `![alt](fig-01.jpg)`.
- `cover.jpg` and `./cover.jpg` both resolve; the CMS may write either.
- A standalone Markdown image becomes a `<figure>`. A Markdown title becomes the
  `<figcaption>`: `![alt](fig-01.jpg "Caption")`.
- Sveltia's rich-text Caption field writes a single-line HTML `<figure>`.
  `src/lib/remark-html-figure.ts` converts it back to a Markdown image before
  Astro collects images, so it still gets the image pipeline and a rebuilt
  figure.

### Markdown body

The body is ordinary Markdown, stored after the closing `---` of the
frontmatter. Use `##` and `###` headings; the article page builds its table of
contents from them. `rehype-slug` adds heading IDs.

## Articles

File: `src/content/articles/<slug>/index.md`

| Field | Required | Schema type | Default | Notes |
| --- | --- | --- | --- | --- |
| `title` | Yes | string | — | Article title. |
| `summary` | Yes | string | — | Standfirst. Derive it from the article text. |
| `publishedAt` | Yes | date (coerced) | — | `YYYY-MM-DD`. Used for sorting and display. |
| `updatedAt` | No | date (coerced) | — | Shows an "Updated" date. |
| `series` | No | `reference('series')` | — | Folder slug of an existing series. Stored as a slug in Markdown. |
| `seriesOrder` | No | number | — | Reading order inside the series. Lower comes first. The CMS restricts it to integers ≥ 1. |
| `language` | No | `kn` or `en` | `kn` | Controls typography and reading speed. |
| `author` | No | string | `CPUS` | Byline. |
| `tags` | No | string array | `[]` | Manual, lowercase, URL-safe. See the tag pattern below. |
| `cover` | No | image | — | Cover image beside `index.md`. |
| `coverAlt` | No | string | — | Alt text. Required in practice for accessibility and plate captions. |
| `coverStyle` | No | `hero` or `plate` | auto | Overrides the cover layout. |
| `featured` | No | boolean | `false` | Featured articles can lead the homepage. |
| `draft` | No | boolean | `false` | Hidden in production. |

Cover layout:

- `coverStyle: hero` forces the wide 16:9 treatment.
- `coverStyle: plate` forces the framed editorial treatment.
- If `coverStyle` is omitted, the article page uses **plate** when the cover is
  portrait (`height > width`) or narrower than 700 px. Otherwise it uses hero.
- The homepage lead is the first featured article, or the newest article if none
  is featured.

Tags:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Tags are manual. Do not infer them from the article text. Reuse existing tags
where they fit. A tag page exists only if at least one published article uses it.

Body:

- `##` and `###` headings become the table of contents.
- Use `![alt](fig-01.jpg)` for an image without a caption and
  `![alt](fig-01.jpg "Caption")` for a captioned figure.
- Alt text is required; the caption is optional editorial context.

Example:

```markdown
---
title: "Lessons from the soil"
summary: "A standfirst derived from the article text."
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

## Series

File: `src/content/series/<slug>/index.md`

| Field | Required | Schema type | Default | Notes |
| --- | --- | --- | --- | --- |
| `title` | Yes | string | — | English title. |
| `titleKn` | No | string | — | Kannada title, shown on the series page. |
| `description` | Yes | string | — | Short description for cards and the series header. |
| `cover` | No | image | — | Series card and header image. |
| `order` | No | number | `0` | Sort order on `/series/`. Lower comes first. |
| `featured` | No | boolean | `false` | Shows the series on the homepage. |
| `parent` | No | `reference('series')` | — | Makes this a child series, such as a yearly Nobel edition. |
| `startHere` | No | string array | `[]` | Manual list of article slugs for the "Start here" block. |
| `draft` | No | boolean | `false` | Hidden in production. |

There is **no body**. The series page renders the description and article lists,
not prose. The CMS collection therefore has no Body field.

`startHere` is an array of article slugs, not a typed reference in the Zod
schema. The CMS uses a multi-select relation, and `bun run check:cms` verifies
that every slug exists. `getStartHereArticles()` silently skips a missing slug,
so a typo would otherwise only remove a card.

Child series are excluded from the top-level `/series/` list and are shown under
their parent. Articles in child series count toward the parent series total and
appear in its listing.

Example:

```markdown
---
title: "Journey with Plants"
titleKn: "ಸಸ್ಯಯಾನ"
description: "A CPUS series on the plants around us, their names, histories, and uses."
cover: ./cover.jpg
order: 1
featured: true
parent: nobel
startHere: [tomato, lessons-from-soil]
draft: false
---
```

## Pages

File: `src/content/pages/<slug>/index.md`

| Field | Required | Schema type | Default | Notes |
| --- | --- | --- | --- | --- |
| `title` | Yes | string | — | Page heading and title tag. |
| `description` | No | string | — | Meta description and page standfirst. |
| `updatedAt` | No | date (coerced) | — | Optional update date. |
| `draft` | No | boolean | `false` | Reserved; see the page limitation above. |

Pages also have a Markdown body. Page images live beside the page `index.md`.

Example:

```markdown
---
title: "About CPUS"
description: "About the Center for Public Understanding of Science (CPUS)."
updatedAt: 2026-11-13
---

The Center for Public Understanding of Science (CPUS) is based in Bengaluru.
```

A page is only routable if a matching Astro route exists. See
[Adding a page](adding-a-page.md).

## How Sveltia stores each field

| Content | Markdown | Sveltia widget | Written value |
| --- | --- | --- | --- |
| Title, summary, author | quoted strings | string / text | YAML string |
| Published / updated dates | `2026-01-01` | date picker (UTC) | `YYYY-MM-DD` |
| Series | `series: journey-with-plants` | relation | Folder slug |
| Parent series | `parent: nobel` | relation, current series excluded | Folder slug |
| Start here | YAML list of slugs | multi-relation | YAML list of slugs |
| Tags | inline or block list | list of strings | YAML list |
| Cover | `cover: ./cover.jpg` | image | Relative filename, usually `cover.jpg` |
| Cover alt | quoted string | string | YAML string |
| Cover style | `hero` / `plate` | select | Enum value |
| Featured, draft | `true` / `false` | boolean toggle | YAML boolean |
| Optional fields left empty | omitted | optional widget | Key omitted (`omit_empty_optional_fields: true`) |
| Body | Markdown after frontmatter | raw / rich text | Markdown; rich-text captions may be HTML figures |

Sveltia strips trailing whitespace and may normalise Markdown on the first save.
Review the diff of an existing entry rather than assuming it is unchanged.

## Validation layers

| Layer | Catches |
| --- | --- |
| CMS field rules | Missing required fields, invalid slug and tag patterns, invalid enum values, missing relation target. |
| `bun run check:cms` | CMS/schema drift, loose `.md` files, non-bundle entries, invalid slugs/tags, broken series and parent references, missing `startHere` articles, missing local covers/body images, images moved into `public/`. |
| Astro + Zod build | Missing required frontmatter, wrong types, uncoercible dates, unresolved image paths. |
| `bun test` | The Sveltia HTML-figure-to-Markdown transform. |
| CI | Runs all of the above before the Pages build. |

## Changing the model

When adding, renaming, or removing a field:

1. Update `src/content.config.ts`.
2. Update `public/admin/config.yml` in the same commit.
3. Update the `model` table in `scripts/check-cms-model.ts`.
4. Update the templates or query layer if the field is rendered.
5. Update this document and the relevant `adding-*.md` guide.
6. Run `bun run check:cms`, `bun test`, `bun run check`, and `bun run build`.
7. Make one commit for the model change and its documentation.

Do not let the CMS and the Astro schema drift. The CMS is an editor for the
schema, not a second content model.
