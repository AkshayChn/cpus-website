# Editorial guide

This guide covers how to write, tag, illustrate, and review content. For the
mechanics of creating an entry, use the task guides:

| Task | Guide |
| --- | --- |
| Add or edit an article | [Adding an article](adding-an-article.md) |
| Add or edit a series | [Adding a series](adding-a-series.md) |
| Add or edit a page | [Adding a page](adding-a-page.md) |
| Use the Sveltia editor | [Using the CMS](using-the-cms.md) |
| Look up a field or type | [Data model](data-model.md) |

## Content integrity

This site is a replacement for a real publication. Do not invent facts or copy.

- Contact details, donation details, social links, names, dates, and factual
  claims must come from the WordPress export in `work/` or the live
  <https://cfpus.org/> site.
- Article summaries must be derived from the article text, not written from
  assumption.
- If a detail is uncertain, use an explicit placeholder or ask. Do not guess.
- The bank account name is intentionally `Centre for Public Understanding of
  Sceince`; keep the spelling exactly as supplied by CPUS.
- Body-image alt text still needs a human editorial pass on some migrated
  articles. Do not treat the current alt text as final.
- Do not add a factual claim just to fill a section. An empty, honest section is
  better than an invented one.

The WordPress export and `work/` are local reference material and are never
committed.

## Titles and summaries

- The title should match the article's subject, not its conclusion.
- The summary is the standfirst. It should tell a reader what the piece is about
  and why it matters, in one or two sentences.
- Derive the summary from the finished article. Do not write it from the title
  alone.
- Keep the summary consistent with the body. If the body changes materially,
  revise the summary.
- Avoid clickbait, unsupported superlatives, and claims the article does not
  make.

## Body and headings

- Use `##` for main sections and `###` for subsections. The article page builds
  its table of contents from them.
- Keep headings descriptive. A reader should understand the structure from the
  headings alone.
- Kannada prose is left-aligned with generous line height. Do not use italics
  for emphasis in Kannada; use wording or bold instead.
- Latin words inside Kannada prose use the serif reading stack. Do not add a
  separate Latin webfont or manually style them.
- Use normal Markdown links. Internal links should include the trailing slash,
  for example `/articles/tomato/`.
- Do not use raw HTML for layout. The Markdown pipeline handles figures,
  headings, lists, blockquotes, and tables.

## Tags

Tags are **manual**. Do not infer them from the article text, and do not add a
tag that only appears in a throwaway sentence.

Rules:

- Lowercase ASCII letters, digits, and hyphens only.
- Match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- No spaces, uppercase, underscores, or leading/trailing hyphens.
- Reuse existing tags where they fit. The full list is at `/tags/`.
- Prefer a small, meaningful set over a long list. Three to five tags is usually
  enough.
- Do not add a tag for every noun. A tag should help a reader find related
  articles.

Examples: `science-history`, `nobel`, `climate`, `public-health`.

Tags are collected from published articles. A tag page exists only if at least
one published article uses that tag.

## Images

### Alt text

Alt text is required in practice, even where the schema marks it optional. It is
the accessible name of the image and, for plate covers, the visible caption.

- Describe what the image shows, not the article's argument.
- Be specific: "A tomato plant with red and green fruit" is better than "Tomato".
- Do not start with "Image of" or "Photo of".
- Do not repeat the caption. The caption adds context; the alt text identifies
  the image.
- Decorative images should not be added. If an image carries no information,
  leave it out.

### Captions

Captions are optional editorial context. Use them when the image needs a source,
a place, a date, or an explanation that the alt text should not carry.

```markdown
![A field of millet at the edge of the village](fig-01.jpg "Millet at the edge of the field, photographed in 2025.")
```

The alt text is inside the square brackets. The caption is the quoted title. In
the CMS, use the image dialog's **Caption** field or the raw Markdown form.

### Covers

- A wide landscape image works best as a hero.
- A portrait image, or one narrower than 700 px, automatically uses the framed
  plate treatment. Set `coverStyle: plate` explicitly for a composite, graphic,
  or low-resolution cover that should not be stretched.
- `coverAlt` is the accessible name and the plate caption. Write it for the
  image, not the article.
- Do not put text-heavy graphics in a hero crop; the text will be cut or
  stretched.

### Image files

- Prefer local `.jpg`, `.jpeg`, `.png`, or `.webp` files.
- Keep images beside the entry's `index.md`; do not put content images in
  `public/`.
- Optimise large images before upload. The CMS limit is 10 MiB, and the GitHub
  backend does not support Git LFS.
- Use descriptive filenames (`fig-01.jpg`, `cover.jpg`), not camera filenames.

## Drafts and review

- Set `draft: true` while an article or series is being reviewed. Drafts are
  visible in `bun run dev` but excluded from production lists, tag counts,
  series pages, and generated routes.
- Page drafts are not currently enforced by the fixed routes. Do not rely on
  `draft` to hide About or Resources; keep the route out of the build until the
  page is ready.
- Review the rendered page, not only the Markdown. Check the cover treatment,
  table of contents, reading time, and mobile layout.
- If you edit an existing entry in the CMS, review the first Git diff for
  Markdown normalisation or image-path changes.

## Publishing checklist

- [ ] Slug is lowercase ASCII, hyphenated, and has no date.
- [ ] Frontmatter matches the schema.
- [ ] Summary is derived from the article.
- [ ] Tags are manual, lowercase, URL-safe, and useful.
- [ ] Series slug exists, and `seriesOrder` is correct.
- [ ] Cover exists, has `coverAlt`, and uses the right `coverStyle`.
- [ ] Body images have alt text and useful captions.
- [ ] Kannada text is left-aligned; no italics for emphasis.
- [ ] Latin words inside Kannada prose use the serif fallback.
- [ ] Dark mode and light mode both look right.
- [ ] The page renders at 360 px, 390 px, tablet, and desktop.
- [ ] Internal links are valid and include trailing slashes.
- [ ] No invented names, dates, contact details, or donation details.
- [ ] If saved through the CMS, the Git diff has no unintended changes.
- [ ] `bun run check:cms`, `bun test`, `bun run check`, and `bun run build`
      pass.

## Common failures

| Error | Cause | Fix |
| --- | --- | --- |
| `title: Required` or similar | Missing required frontmatter | Add the field. |
| Invalid date | `publishedAt` is not a date | Use `YYYY-MM-DD`. |
| Invalid tag | Uppercase, space, underscore, or empty segment | Use lowercase and hyphens. |
| Unknown series reference | `series` does not match a series folder | Create the series or correct the slug. |
| Image not found | Wrong relative path or missing file | Keep images beside `index.md` and use their filename. |
| Missing tag page | No published article uses the tag | Add the tag to a published article. |
| Article missing from production | `draft: true` | Set `draft: false`. |
| CMS sign-in fails with a fine-grained token | The repository is on a personal account and you are an outside collaborator | Move the repository to an organization and join it as a member. |
| CMS save fails with “Resource not accessible by personal access token” | The token lacks Contents write | Edit or recreate the token with the required permissions. |
| CMS rejects a new slug | It contains uppercase, spaces, underscores, or non-ASCII characters | Use lowercase ASCII letters, numbers, and hyphens. |
| CMS image is missing after save | The upload went to the wrong folder or the Markdown path is wrong | Keep content images beside the entry's `index.md` and use the Markdown image syntax. |

For the full field and validation reference, see [Data model](data-model.md).
For CMS login, media, and save behaviour, see [Using the CMS](using-the-cms.md).
