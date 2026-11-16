# Adding a page

Pages are fixed prose routes such as About and Resources. They are a content
collection **and** a route: the Markdown supplies the prose, and an Astro file
turns it into a URL.

```text
src/content/pages/<slug>/index.md   # content
src/pages/<slug>.astro              # route
```

A content file alone is not enough. Nothing will link to it or build it without
a route. The CMS can edit existing pages, but it cannot create or delete them.

## Before you start

- Decide the slug and the URL. They should match, for example `about` →
  `/about/`.
- Confirm the page is genuinely a standalone prose page. Contact and Donate are
  code-only routes: they read structured data from `src/data/site.ts`, not the
  `pages` collection.
- Prepare any images as local `.jpg`, `.jpeg`, `.png`, or `.webp` files.

## Option A: add with Git

### 1. Create the content bundle

```bash
mkdir -p src/content/pages/my-page
```

Create `src/content/pages/my-page/index.md`:

```markdown
---
title: "My Page"
description: "A short description for metadata and the page standfirst."
updatedAt: 2026-01-01
---

Page prose starts here.

## A section heading

![Alt text](fig-01.jpg "Optional caption")
```

Only `title` is required. Page images live beside `index.md`:

```text
src/content/pages/my-page/index.md
src/content/pages/my-page/fig-01.jpg
```

### 2. Create the route

Create `src/pages/my-page.astro`. This is the same pattern as
`src/pages/about.astro`:

```astro
---
import { getEntry, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Container from '../components/Container.astro';

const entry = await getEntry('pages', 'my-page');
if (!entry) throw new Error('Missing my-page content');
const { Content } = await render(entry);
---

<BaseLayout title={entry.data.title} description={entry.data.description}>
  <Container class="py-10 sm:py-14">
    <article class="mx-auto max-w-3xl">
      <header class="border-b border-rule pb-6">
        <p class="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-highlight">My page</p>
        <h1 class="mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {entry.data.title}
        </h1>
        {entry.data.description && (
          <p class="mt-4 text-lg leading-relaxed text-muted">{entry.data.description}</p>
        )}
      </header>
      <div class="prose-cpus mt-8">
        <Content />
      </div>
    </article>
  </Container>
</BaseLayout>
```

Change the `getEntry` slug and the small kicker label (`My page`). Keep the
`<BaseLayout>` title and description.

> **Draft limitation.** The fixed page routes call `getEntry` directly and do
> not filter `draft`. Do not rely on `draft: true` to hide a page. Keep the route
> out of the build until the page is ready.

### 3. Add it to navigation

The header and footer are defined in `src/data/site.ts`. Add the page to `nav`,
`footer`, or both:

```ts
nav: [
  // ...
  { label: 'My Page', href: '/my-page/' },
],
```

Skip this if the page should only be reachable by a direct link. Do not add a
nav item for a page that is not ready.

### 4. Preview and check

```bash
bun run dev
```

Open <http://localhost:4321/my-page/>. Then run:

```bash
bun run check:cms
bun test
bun run check
bun run build
```

`bun run check:cms` expects every folder under `src/content/pages/` to be a page
bundle, but it does not require an Astro route. The route is checked by
`astro check` and the build.

### 5. Commit

```bash
git add src/content/pages/my-page src/pages/my-page.astro src/data/site.ts
git commit -m "content: add page \"my-page\""
git push
```

## Option B: edit with the CMS

The CMS can edit the existing pages:

1. Open <https://channesh.org/admin/> (locally,
   <http://localhost:4321/admin/index.html>).
2. Choose **Pages**.
3. Open **About CPUS** or **Resources**.
4. Edit the **Title**, **Description**, **Updated at**, or **Body**.
5. Upload a body image from the rich-text editor if needed. It is stored beside
   the page `index.md`.
6. Select **Save**.

The page slug is fixed in the CMS, and the collection has `create: false` and
`delete: false`. To add a new page, create the content bundle and route with Git
as above. The page then appears in the CMS for future editing.

A CMS save commits to the branch configured in `public/admin/config.yml`, not to
your local working tree. Pull before checking locally:

```bash
git pull --ff-only
```

### What the CMS writes

```text
src/content/pages/about/index.md
src/content/pages/about/fig-01.jpg
```

It does not create `src/content/pages/about.md`, and it does not change
`src/pages/about.astro`.

## After either path

Inspect the diff:

```bash
git status --short
git show --stat HEAD
git diff HEAD^ -- src/content/pages/my-page/index.md
```

Check:

- [ ] The page is at `src/content/pages/my-page/index.md`, not a loose `.md`
      file.
- [ ] A route exists at `src/pages/my-page.astro` and uses the same slug.
- [ ] Images are beside `index.md`.
- [ ] The route renders the title, description, and body.
- [ ] Navigation is updated only if the page should be public.
- [ ] `/my-page/` renders at 360 px, 390 px, tablet, and desktop.
- [ ] `bun run check:cms`, `bun test`, `bun run check`, and `bun run build` pass.

## Common mistakes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Content exists but no URL | No `src/pages/<slug>.astro` route | Add the route. |
| Route says `Missing ... content` | The `getEntry` slug does not match the folder | Use the same slug in both places. |
| Page does not appear in the CMS | The folder is not `<slug>/index.md` | Convert it to a page bundle. |
| Image not found | Image is not beside `index.md` or the path is wrong | Keep it in the page folder and reference its filename. |
| Page still builds when draft | Fixed routes do not filter `draft` | Remove the route or do not merge it yet. |
| Nav link is broken | Href does not match the route | Use `/my-page/` with a trailing slash. |

For the complete field list, see [Data model](data-model.md).
