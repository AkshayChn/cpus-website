# Documentation

Public, committed documentation for the CPUS website. Start here, then open the
guide for the task you are doing. Everything in this directory is part of the
repository and should stay current when the site changes.

## Guides

| Document | Use it when | Audience |
| --- | --- | --- |
| [Adding an article](adding-an-article.md) | You need to publish a new article, with either Git or the CMS. | Editors, authors |
| [Adding a series](adding-a-series.md) | You need a new series, a child series, or a curated reading order. | Editors, authors |
| [Adding a page](adding-a-page.md) | You need a new prose page such as About or Resources. | Editors, developers |
| [Using the CMS](using-the-cms.md) | You need to sign in, edit, upload images, or understand what the CMS can and cannot do. | Editors |
| [Data model](data-model.md) | You need the exact fields, types, defaults, paths, or validation rules. | Editors, developers |
| [Editorial guide](content-guide.md) | You need the writing, tagging, image-alt, integrity, and review rules. | Editors, authors |
| [Architecture](architecture.md) | You need to understand how Astro builds the site, routes, styles, and deploys. | Developers |

The public overview is the repository [README](../README.md).

## The content model in one screen

All content is Markdown with YAML frontmatter. Every entry is a **page bundle**:
one folder per entry, with the Markdown file named `index.md` and local images
beside it.

```text
src/content/
├── articles/<slug>/index.md   # + cover and body images
├── series/<slug>/index.md     # + cover image
└── pages/<slug>/index.md      # + page images
```

| Collection | URL | Created in the CMS? | Deleted in the CMS? |
| --- | --- | --- | --- |
| Articles | `/articles/<slug>/` | Yes | No |
| Series | `/series/<slug>/` | Yes | No |
| Pages | Fixed routes such as `/about/` | No | No |

The slug is the folder name. There is no separate `slug` field. Slugs are
lowercase ASCII letters, digits, and single hyphens:
`^[a-z0-9]+(?:-[a-z0-9]+)*$`.

## The sources of truth

Change these together when the content model changes:

| File | Role |
| --- | --- |
| `src/content.config.ts` | Astro content collections and Zod schemas. The build contract. |
| `public/admin/config.yml` | Sveltia CMS fields, widgets, paths, and validation. Mirrors the schema. |
| `scripts/check-cms-model.ts` | Cross-checks the CMS config, content tree, references, tags, and media. |
| `docs/data-model.md` | Human-readable field reference. |
| `docs/adding-*.md` | Task guides that show the fields in use. |

Run the permanent checks before committing:

```bash
bun run check:cms
bun test
bun run check
bun run build
```

`bun run check:cms` fails on CMS/schema drift, misplaced files, invalid slugs or
tags, broken series references, missing local images, and content images in
`public/`.
