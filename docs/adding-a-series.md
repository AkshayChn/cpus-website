# Adding a series

A series groups articles and gives them a reading order. It is one folder under
`src/content/series/`:

```text
src/content/series/<slug>/
├── index.md
└── cover.jpg
```

A series has metadata only. It has **no body**; the series page renders the
description and the article lists.

## Before you start

- Pick a lowercase ASCII slug, for example `journey-with-plants` or `nobel`.
- Decide whether this is a top-level series or a child of an existing series.
  A child is typically one edition of a yearly series, such as
  `nobel-2026-physics` under `nobel`.
- Prepare a cover image if you want a card and header image.
- Know which articles belong to it. Create the series before assigning
  `series` on an article.

## Option A: add with Git

### 1. Create the folder and file

```bash
mkdir -p src/content/series/my-series
```

Create `src/content/series/my-series/index.md`.

### 2. Add the frontmatter

```markdown
---
title: "My Series"
titleKn: "ನನ್ನ ಸರಣಿ"
description: "A short description for cards and the series header."
cover: ./cover.jpg
order: 1
featured: true
parent: nobel
startHere: [tomato, lessons-from-soil]
draft: false
---
```

Only `title` and `description` are required.

### 3. Add the cover

Put the image beside `index.md`:

```text
src/content/series/my-series/cover.jpg
```

Reference it as `cover: ./cover.jpg` or `cover: cover.jpg`.

### 4. Connect articles

On each article, set:

```yaml
series: my-series
seriesOrder: 1
```

`seriesOrder` is the reading position. Lower comes first; if omitted, the
article falls to the end and sorts by publication date.

`startHere` is a manual list of article slugs for the series landing page. It is
not inferred from the article order. Use it when a newcomer should read a
specific piece first.

### 5. Preview and check

```bash
bun run dev
```

Open <http://localhost:4321/series/my-series/> and `/series/`. Then run:

```bash
bun run check:cms
bun test
bun run check
bun run build
```

### 6. Commit

```bash
git add src/content/series/my-series
git commit -m "content: add series \"my-series\""
git push
```

## Option B: add with the CMS

The CMS is at <https://channesh.org/admin/> (locally,
<http://localhost:4321/admin/index.html>). See [Using the CMS](using-the-cms.md)
for the token steps.

1. Open **Series** and choose **New Series**.
2. Enter the **Title** and optional **Kannada title**.
3. Enter the **Description**. This is what cards and the series header show.
4. Upload a **Cover image** if wanted.
5. Set **Order**. Lower numbers appear first on `/series/`.
6. Set **Featured** if the series should appear on the homepage.
7. Select a **Parent series** only if this is a child series. The current series
   is excluded from its own parent options.
8. Select **Start here** articles. These are stored as article slugs.
9. Leave **Draft** off when the series is ready.
10. Select **Save**.

There is no Body field in the series editor. That is intentional: the series
page does not render prose.

The CMS commits to the branch configured in `public/admin/config.yml`, not to
your local working tree. Pull before checking locally:

```bash
git pull --ff-only
```

### What the CMS writes

```text
src/content/series/my-series/index.md
src/content/series/my-series/cover.jpg
```

Relations are stored as folder slugs:

```yaml
parent: nobel
startHere:
  - tomato
  - lessons-from-soil
```

## Ordering and child series

- `/series/` sorts by `order`, then title.
- Child series are hidden from the top-level `/series/` list and shown under
  their parent.
- Articles in a child series count toward the parent series total and appear in
  the parent listing.
- `featured: true` puts a series on the homepage. Only a few fit; check the
  homepage after changing it.
- Draft series are hidden from production lists and routes.

## After either path

Inspect the diff:

```bash
git status --short
git show --stat HEAD
git diff HEAD^ -- src/content/series/my-series/index.md
```

Check:

- [ ] The series is at `src/content/series/my-series/index.md`, not a loose
      `.md` file.
- [ ] The cover is beside `index.md`.
- [ ] `parent` is empty or points at an existing series.
- [ ] `startHere` contains real article slugs.
- [ ] Articles that belong to it use `series: my-series`.
- [ ] The series page shows the intended reading order.
- [ ] `bun run check:cms`, `bun test`, `bun run check`, and `bun run build` pass.

## Common mistakes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Series does not appear | `draft: true` | Set `draft: false`. |
| Child appears at the top level | `parent` is missing or wrong | Set the parent series slug. |
| Start here block is missing | `startHere` is empty or the article is a draft | Add published article slugs. |
| Article order is wrong | `seriesOrder` is missing or duplicated | Set distinct numbers. |
| Unknown parent | `parent` does not match a series folder | Create the parent or fix the slug. |
| CMS rejects the slug | Uppercase, spaces, or non-ASCII characters | Use lowercase ASCII letters, digits, and hyphens. |

For the complete field list, see [Data model](data-model.md).
