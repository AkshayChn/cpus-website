# Adding an article

An article is one folder under `src/content/articles/`, with a Markdown file and
its images:

```text
src/content/articles/<slug>/
├── index.md
├── cover.jpg
└── fig-01.jpg
```

You can create it with Git and a text editor, or with the CMS. Both write the
same files. The field reference is in [Data model](data-model.md).

## Before you start

- Pick a **slug**: lowercase ASCII letters, digits, and single hyphens, for
  example `lessons-from-soil` or `nobel-2026-physics`. It becomes the URL and
  should not contain a date or Kannada characters.
- If the article belongs to a series, confirm the series already exists under
  `src/content/series/<slug>/index.md`.
- Prepare the cover and body images as local `.jpg`, `.jpeg`, `.png`, or `.webp`
  files.
- Know the facts. Contact details, names, dates, and claims must come from the
  WordPress export, the live `cfpus.org` site, or the author. Do not invent.

## Option A: add with Git

### 1. Create the folder and file

```bash
mkdir -p src/content/articles/my-article
```

Create `src/content/articles/my-article/index.md`.

### 2. Add the frontmatter

```markdown
---
title: "The article title"
summary: "A standfirst derived from the article text, not from assumption."
publishedAt: 2026-01-01
updatedAt: 2026-01-05
series: journey-with-plants
seriesOrder: 1
language: kn
author: CPUS
tags: [soil, agriculture, environment]
cover: ./cover.jpg
coverAlt: "A description of the cover image, not the article."
coverStyle: hero
featured: false
draft: false
---

Body text starts here.
```

Only `title`, `summary`, and `publishedAt` are required. Remove an optional
field if you do not need it; do not leave it with an empty value.

### 3. Add the images

Put the cover and body images in the same folder:

```text
src/content/articles/my-article/cover.jpg
src/content/articles/my-article/fig-01.jpg
```

Reference them relatively from `index.md`:

```markdown
![A field of millet](fig-01.jpg)
![A field of millet](fig-01.jpg "Millet at the edge of the field.")
```

The first form produces an image. The second produces a `<figure>` with a
`<figcaption>`. Alt text is required; the caption is optional.

### 4. Write the body

Use Markdown. `##` and `###` headings become the table of contents.

- Keep the summary consistent with the article.
- Use manual, lowercase tags from the existing tag list where possible.
- If the article is in a series, set `series` to the series folder name and
  `seriesOrder` to its reading position. Lower numbers come first.
- Set `draft: true` while the article is being reviewed. Drafts are visible in
  `bun run dev` but excluded from production.

### 5. Preview and check

```bash
bun run dev
```

Open <http://localhost:4321/articles/my-article/>. Then run:

```bash
bun run check:cms
bun test
bun run check
bun run build
```

### 6. Commit

```bash
git add src/content/articles/my-article
git commit -m "content: add article \"my-article\""
git push
```

## Option B: add with the CMS

The CMS is at <https://channesh.org/admin/> (locally,
<http://localhost:4321/admin/index.html>). It is not linked from the public
site. You need a fine-grained GitHub token with **Contents: Read and write**.
See [Using the CMS](using-the-cms.md) for the token steps.

1. Open **Articles** and choose **New Article**.
2. Enter the **Title**. The CMS proposes a slug; replace it with your own
   lowercase ASCII slug if needed. The slug cannot be changed after creation.
3. Fill **Summary**, **Published at**, and the optional fields.
4. Select a **Series** only if it already exists. Set **Series order**.
5. Choose **Language** (`kn` or `en`), the **Author**, and manual **Tags**.
6. Upload a **Cover image**, then fill **Cover alt text**. Leave **Cover style**
   empty to choose hero/plate automatically, or force one.
7. Write the **Body**. The editor opens in raw Markdown so existing formatting
   is preserved; rich text is optional.
8. To upload a body image, switch to rich text and use **Image → Upload**. The
   raw Markdown image button only inserts `![]()`; it does not upload a file.
   Use the image dialog's **Caption** field, or raw
   `![alt](fig-01.jpg "Caption")`.
9. Review the entry and select **Save**.

The CMS commits to the branch configured in `public/admin/config.yml`. It does
not write your local working tree. Pull the commit before checking locally:

```bash
git pull --ff-only
```

### What the CMS writes

```text
src/content/articles/my-article/index.md
src/content/articles/my-article/cover.jpg
src/content/articles/my-article/fig-01.jpg
```

The frontmatter is ordinary YAML. A relation is stored as the other entry's
folder slug, not as a title or path:

```yaml
series: journey-with-plants
```

Optional fields left empty are omitted. Dates are written as `YYYY-MM-DD`.
Boolean fields are written as `true` or `false`.

## After either path

Inspect the diff:

```bash
git status --short
git show --stat HEAD
git diff HEAD^ -- src/content/articles/my-article/index.md
```

Check:

- [ ] The article is at `src/content/articles/my-article/index.md`, not a loose
      `.md` file.
- [ ] The cover and body images are in the same folder.
- [ ] `cover` is relative (`cover.jpg` or `./cover.jpg`).
- [ ] The series value is a real series slug.
- [ ] Tags are manual, lowercase, and URL-safe.
- [ ] `publishedAt` is date-only.
- [ ] `draft` is correct.
- [ ] The page renders at 360 px, 390 px, tablet, and desktop.
- [ ] Kannada typography and dark mode look right.
- [ ] `bun run check:cms`, `bun test`, `bun run check`, and `bun run build` pass.

If a CMS save touched an existing article, review the diff carefully. Sveltia
strips trailing whitespace and may normalise Markdown the first time it saves.
It should not move the folder or change the image layout.

## Common mistakes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build says `title: Required` | Missing frontmatter | Add the field. |
| Invalid date | `publishedAt` is not `YYYY-MM-DD` | Use a date-only value. |
| Invalid tag | Uppercase, space, underscore, or empty segment | Use lowercase letters, digits, and hyphens. |
| Unknown series | `series` does not match a series folder | Create the series or fix the slug. |
| Image not found | Wrong relative path or missing file | Keep the image beside `index.md` and use its filename. |
| Cover stretched | A graphic or narrow image is in hero mode | Set `coverStyle: plate`. |
| Article missing in production | `draft: true` | Set `draft: false` and merge. |
| CMS rejects the slug | Uppercase, spaces, or non-ASCII characters | Type a lowercase ASCII slug. |

For the complete field list, see [Data model](data-model.md). For writing and
tagging standards, see [Editorial guide](content-guide.md).
