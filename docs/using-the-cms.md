# Using the CMS

The CMS is [Sveltia](https://sveltiacms.app/) at
<https://channesh.org/admin/> (locally,
<http://localhost:4321/admin/index.html>). It is a static page that talks to the
GitHub API from your browser. There is no CMS server, database, or OAuth
service.

The admin page is `noindex` and is not linked from the public site.

## What you can do

| Collection | Create | Edit | Delete |
| --- | --- | --- | --- |
| Articles | Yes | Yes | No |
| Series | Yes | Yes | No |
| Pages | No | Yes | No |

The CMS edits Markdown and images only. It cannot edit `src/data/site.ts`,
navigation, styles, layouts, routes, or code. Those remain code-reviewed.

## Access and the token

The CMS uses a **fine-grained personal access token** (PAT). Sveltia stores it in
your browser's `localStorage`; it is not committed to the repository.

### Organization requirement

Fine-grained PATs cannot write to a repository where you are an **outside or
repository collaborator** on a personal account. Editors must be **members of
the GitHub organization that owns the repository** with write access.

The repository is currently owned by a personal account, so only the owner can
use a PAT today. Before onboarding other editors, transfer the repository to a
free GitHub organization and add them as organization members.

### Create a token

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Resource owner**: the organization that owns the repository. Until the
   transfer, the current owner account.
3. **Repository access**: only `cpus-website`.
4. **Repository permissions**: **Contents: Read and write**.
5. **Expiration**: 90 days is a reasonable default.
6. **Name**: `CPUS CMS — <your name>`.
7. Generate the token and copy it.

Do not add **Pull requests** permission unless the CMS is switched to the
editorial workflow. The current configuration uses `publish_mode: simple` and
commits directly.

### Sign in

1. Open <https://channesh.org/admin/>.
2. Choose **Sign In Using Access Token**.
3. Paste the token.
4. The content library opens.

If you are working locally, use <http://localhost:4321/admin/index.html>.

**Firefox:** token sign-in works. Sveltia's **Work with Local Repository** does
not, because it needs the File System Access API. Use Chrome or Edge if you want
to edit local files without a token.

Do not put a token in chat, a file, `work/`, a screenshot, or a commit.

## The library

The CMS opens three collections:

- **Articles** — sorted by published/updated date and title.
- **Series** — sorted by order and title.
- **Pages** — sorted by title and updated date.

Each entry has a preview link. Sveltia previews the public URL, so it shows the
deployed page, not unsaved local changes.

## Edit an existing entry

1. Choose the collection and open the entry.
2. Edit the fields.
3. Review the body. It opens in **raw Markdown** first so existing formatting is
   preserved.
4. Select **Save**.

A save creates a Git commit on the branch configured in
`public/admin/config.yml`. During the CMS integration that branch is
`sveltia-cms`; after merge it is `main`. The file path does not change: an
article stays at `src/content/articles/<slug>/index.md`.

Pull the commit before checking locally:

```bash
git pull --ff-only
```

### Review the first diff

Sveltia strips trailing whitespace and may normalise Markdown on the first save
of an existing entry. Review the diff rather than assuming it is untouched:

```bash
git show --stat HEAD
git diff HEAD^ -- src/content/articles/<slug>/index.md
```

The folder, cover, series, tags, and body should remain intact. If a line break
depended on two trailing spaces, use a blank line or `<br>` instead.

## Create an article

See [Adding an article](adding-an-article.md) for the full walkthrough.

1. **Articles → New Article**.
2. Enter the title.
3. Type a lowercase ASCII slug. Sveltia may propose one from the title; for a
   Kannada title you must type it yourself. It cannot be changed later.
4. Fill the summary, dates, series, order, language, author, and manual tags.
5. Upload a cover and fill the cover alt text.
6. Write the body.
7. **Save**.

The CMS writes:

```text
src/content/articles/<slug>/index.md
src/content/articles/<slug>/cover.jpg
src/content/articles/<slug>/<body-image>
```

## Create a series

See [Adding a series](adding-a-series.md) for the full walkthrough.

1. **Series → New Series**.
2. Fill the title, optional Kannada title, and description.
3. Upload a cover if wanted.
4. Set order and featured.
5. Select a parent only for a child series. The current series is excluded from
   its own parent options.
6. Select **Start here** articles.
7. **Save**.

There is no Body field. The series page renders the description and article
lists, not prose.

## Edit a page

See [Adding a page](adding-a-page.md). The CMS can edit About and Resources but
cannot create or delete pages. A page slug is fixed. To add a new page, create
the content bundle and Astro route with Git; the page then appears in the CMS.

## Media uploads

All content media is **entry-relative**:

- article cover and body images beside `src/content/articles/<slug>/index.md`;
- series covers beside `src/content/series/<slug>/index.md`;
- page images beside `src/content/pages/<slug>/index.md`.

`public/uploads` exists only as the Asset Library fallback. Do not choose it for
article, series, or page images unless you deliberately want an unoptimised
public file.

In the editor:

- **Cover image**: use the image field. It uploads beside the entry.
- **Body image**: switch the body to **rich text** and use **Image → Upload**.
  The raw Markdown image button only inserts `![]()`; it does not upload.
- **Caption**: use the image dialog's **Caption** field, or write
  `![alt](fig-01.jpg "Caption")` in raw Markdown. Both become a `<figure>` with
  an optimised image.
- **Alt text**: always fill it. It is the accessible name of the image.

Limits and behaviour:

- Maximum file size is 10 MiB.
- Filenames are slugified.
- Prefer `.jpg`, `.jpeg`, `.png`, or `.webp`.
- The GitHub backend does not support Git LFS. Optimise large images before
  upload.
- Astro generates responsive WebP variants at build time. Remote images bypass
  the pipeline.

## Validation

The CMS enforces:

- required fields;
- lowercase ASCII slug and tag patterns;
- valid `language` and `coverStyle` options;
- relation targets that exist.

The build and `bun run check:cms` enforce more. A save can succeed in the CMS and
still fail CI if, for example, an image is missing or a `startHere` slug is
wrong. Always check the commit.

Slug and tag pattern:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Uppercase, spaces, underscores, Kannada characters, and leading/trailing hyphens
are rejected.

## Drafts

For articles and series, `draft: true` hides the entry from production lists,
tag counts, series pages, and generated routes. Drafts remain visible in
`bun run dev`.

Page drafts are not currently enforced by the fixed routes. Do not use
`draft: true` to hide a page; keep the route out of the build until it is ready.

## Saving and deployment

The CMS uses `publish_mode: simple`: a save commits directly to the configured
branch. There is no review branch, pull request, or scheduled publish.

- On the `sveltia-cms` integration branch, saves go to `sveltia-cms` and do not
  deploy.
- After merge, `backend.branch` is `main`, and each save triggers the Pages
  workflow.
- The commit messages are generated from the collection and slug, for example
  `content: update articles "tomato"`.

The CMS cannot delete entries. Remove test or retired content with Git:

```bash
git rm -r src/content/articles/<slug>
git commit -m "content: remove article \"<slug>\""
git push
```

## Local testing

```bash
bun run dev
```

- Chrome or Edge: **Work with Local Repository**, select the repository root,
  and save without a token.
- Firefox: sign in with a token, or use Chrome/Edge for the local workflow.

After changing the CMS configuration, run:

```bash
bun run check:cms
bun test
bun run check
bun run build
```

## Limitations

| Limitation | Detail |
| --- | --- |
| No page creation | Pages are fixed routes; add the content bundle and route with Git. |
| No deletion | Articles, series, and pages have `delete: false`. Use Git. |
| No code editing | `src/data/site.ts`, navigation, styles, layouts, and routes are not exposed. |
| No publish review | `publish_mode: simple` commits directly to the configured branch. |
| GitHub token scope | A PAT is repository-wide within its permissions; the CMS UI is not a security boundary. |
| Firefox local workflow | Requires Chrome or Edge for the File System Access API. |
| Markdown normalisation | Sveltia may normalise Markdown and strip trailing whitespace on save. |

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Sign-in fails with a fine-grained token | The repository is on a personal account and you are an outside collaborator | Join the organization that owns the repository, or transfer it first. |
| `Resource not accessible by personal access token` | Token lacks Contents write | Recreate the token with **Contents: Read and write**. |
| New slug is rejected | Uppercase, spaces, underscores, or non-ASCII characters | Use lowercase ASCII letters, digits, and hyphens. |
| Tag is rejected | Same pattern as slugs | Use lowercase, hyphenated tags. |
| Body image is missing after save | Uploaded through the raw Markdown button or to the wrong folder | Use rich-text **Image → Upload** and keep it entry-relative. |
| Cover is stretched | A graphic or narrow image is in hero mode | Set `coverStyle: plate`. |
| Save succeeded but the site is unchanged | The commit went to the configured branch and Pages has not rebuilt yet | Check the branch, the Actions run, and hard-refresh. |
| Local files did not change | The CMS commits to GitHub, not your working tree | Run `git pull --ff-only`. |
| Page draft still renders | Fixed page routes do not filter `draft` | Remove the route or do not merge it yet. |

## Related guides

- [Adding an article](adding-an-article.md)
- [Adding a series](adding-a-series.md)
- [Adding a page](adding-a-page.md)
- [Data model](data-model.md)
- [Editorial guide](content-guide.md)
