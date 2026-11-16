import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';

/**
 * Data-model integrity check for the Astro content collections and the Sveltia CMS config.
 *
 * Run with `bun run check:cms`. It is intentionally dependency-light and runs in CI before the
 * build. It does not replace the Astro schema; it catches CMS/config drift, broken references,
 * misplaced page bundles, invalid tags/slugs, and missing local images that the build would
 * otherwise not notice until a page is rendered.
 */

const root = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];

const fail = (message: string) => errors.push(message);
const warn = (message: string) => warnings.push(message);
const rel = (path: string) => relative(root, path) || '.';
const isFile = (path: string) => existsSync(path) && statSync(path).isFile();
const isDir = (path: string) => existsSync(path) && statSync(path).isDirectory();

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/;

type EntryData = Record<string, unknown>;

interface Entry {
  path: string;
  data: EntryData;
  body: string;
}

interface CollectionModel {
  folder: string;
  slugMode: 'create' | 'fixed';
  fields: string[];
  required: string[];
}

const model: Record<string, CollectionModel> = {
  articles: {
    folder: 'src/content/articles',
    slugMode: 'create',
    fields: [
      'title',
      'summary',
      'publishedAt',
      'updatedAt',
      'series',
      'seriesOrder',
      'language',
      'author',
      'tags',
      'cover',
      'coverAlt',
      'coverStyle',
      'featured',
      'draft',
      'body',
    ],
    required: ['title', 'summary', 'publishedAt'],
  },
  series: {
    folder: 'src/content/series',
    slugMode: 'create',
    fields: [
      'title',
      'titleKn',
      'description',
      'cover',
      'order',
      'featured',
      'parent',
      'startHere',
      'draft',
    ],
    required: ['title', 'description'],
  },
  pages: {
    folder: 'src/content/pages',
    slugMode: 'fixed',
    fields: ['title', 'description', 'updatedAt', 'draft', 'body'],
    required: ['title'],
  },
};

const listDirs = (path: string): string[] =>
  isDir(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];

const listMarkdownFiles = (path: string): string[] =>
  isDir(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => entry.name)
        .sort()
    : [];

const parseEntry = (path: string): Entry | undefined => {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);

  if (!match) {
    fail(`${rel(path)}: missing YAML frontmatter`);
    return undefined;
  }

  let data: unknown;

  try {
    data = parse(match[1]);
  } catch (error) {
    fail(`${rel(path)}: invalid YAML: ${(error as Error).message}`);
    return undefined;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail(`${rel(path)}: frontmatter must be a YAML object`);
    return undefined;
  }

  return { path, data: data as EntryData, body: match[2] };
};

const requireString = (entry: Entry, key: string, { optional = false } = {}) => {
  const value = entry.data[key];

  if (value === undefined) {
    if (!optional) fail(`${rel(entry.path)}: missing required field "${key}"`);
    return undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${rel(entry.path)}: "${key}" must be a non-empty string`);
    return undefined;
  }

  return value;
};

const requireDate = (entry: Entry, key: string, { optional = false } = {}) => {
  const value = entry.data[key];

  if (value === undefined) {
    if (!optional) fail(`${rel(entry.path)}: missing required date "${key}"`);
    return;
  }

  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    fail(`${rel(entry.path)}: "${key}" must be a YYYY-MM-DD date`);
  }
};

const requireBoolean = (entry: Entry, key: string) => {
  const value = entry.data[key];

  if (value !== undefined && typeof value !== 'boolean') {
    fail(`${rel(entry.path)}: "${key}" must be a boolean`);
  }
};

const requireNumber = (entry: Entry, key: string, { optional = false } = {}) => {
  const value = entry.data[key];

  if (value === undefined) {
    if (!optional) fail(`${rel(entry.path)}: missing required number "${key}"`);
    return;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    fail(`${rel(entry.path)}: "${key}" must be an integer`);
  }
};

const decodePath = (value: string): string => {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
};

const isLocalImage = (value: string): boolean =>
  !/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|@|#)/i.test(value);

const checkLocalImage = (
  value: string,
  baseDir: string,
  context: string,
  { allowExternal = false } = {},
) => {
  if (!isLocalImage(value)) {
    if (allowExternal) {
      warn(`${context}: "${value}" is public/external and bypasses Astro's image pipeline`);
      return;
    }

    fail(`${context}: "${value}" must be a local image, not a public or external URL`);
    return;
  }

  const path = resolve(baseDir, decodePath(value));

  if (!isFile(path)) {
    fail(`${context}: image not found: ${value}`);
  }
};

const extractImages = (body: string): string[] => {
  const withoutCode = body.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
  const images = new Set<string>();

  for (const match of withoutCode.matchAll(
    /!\[[^\]]*]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+["'][^"']*["'])?\s*\)/g,
  )) {
    const src = match[1] ?? match[2];

    if (src) images.add(src);
  }

  for (const match of withoutCode.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    images.add(match[1]);
  }

  return [...images];
};

// ---------------------------------------------------------------------------
// CMS configuration
// ---------------------------------------------------------------------------

const configPath = join(root, 'public/admin/config.yml');

if (!isFile(configPath)) {
  fail('public/admin/config.yml is missing');
} else {
  let config: any;

  try {
    config = parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    fail(`public/admin/config.yml: invalid YAML: ${(error as Error).message}`);
  }

  if (config) {
    const collections = Array.isArray(config.collections) ? config.collections : [];

    for (const [name, expected] of Object.entries(model)) {
      const collection = collections.find((item: any) => item.name === name);

      if (!collection) {
        fail(`CMS config: missing "${name}" collection`);
        continue;
      }

      if (collection.folder !== expected.folder) {
        fail(`CMS config: ${name}.folder must be "${expected.folder}"`);
      }

      if (collection.path !== '{{slug}}/index') {
        fail(`CMS config: ${name}.path must be "{{slug}}/index"`);
      }

      if (expected.slugMode === 'create') {
        if (
          !Array.isArray(collection.slug?.editable) ||
          !collection.slug.editable.includes('create') ||
          collection.slug.editable.includes('update')
        ) {
          fail(`CMS config: ${name}.slug must be editable on create only`);
        }

        if (collection.slug?.pattern?.[0] !== SLUG_REGEX.source) {
          fail(`CMS config: ${name}.slug.pattern must match the content slug pattern`);
        }
      } else if (collection.slug?.editable !== false) {
        fail(`CMS config: ${name}.slug must not be editable`);
      }

      if (collection.media_folder !== '' || collection.public_folder !== '') {
        fail(`CMS config: ${name} must use entry-relative media (empty media_folder/public_folder)`);
      }

      if (collection.extension !== 'md') {
        fail(`CMS config: ${name}.extension must be "md"`);
      }

      if (collection.format !== 'yaml-frontmatter') {
        fail(`CMS config: ${name}.format must be "yaml-frontmatter"`);
      }

      if (name === 'pages' && (collection.create !== false || collection.delete !== false)) {
        fail('CMS config: pages must not be created or deleted from the CMS');
      }

      const fields = Array.isArray(collection.fields) ? collection.fields : [];
      const fieldNames = fields.map((field: any) => field.name);

      if (JSON.stringify(fieldNames) !== JSON.stringify(expected.fields)) {
        fail(
          `CMS config: ${name} fields must be [${expected.fields.join(', ')}], found [${fieldNames.join(', ')}]`,
        );
      }

      const field = (fieldName: string) => fields.find((item: any) => item.name === fieldName);
      const expectWidget = (fieldName: string, widget: string) => {
        const item = field(fieldName);

        if (item && (item.widget ?? 'string') !== widget) {
          fail(`CMS config: ${name}.${fieldName} must use widget "${widget}"`);
        }
      };

      for (const required of ['title', ...expected.required]) {
        if (!field(required)) fail(`CMS config: ${name} is missing field "${required}"`);
      }

      if (name === 'articles') {
        expectWidget('summary', 'text');
        expectWidget('publishedAt', 'datetime');
        expectWidget('updatedAt', 'datetime');
        expectWidget('series', 'relation');
        expectWidget('seriesOrder', 'number');
        expectWidget('language', 'select');
        expectWidget('tags', 'list');
        expectWidget('cover', 'image');
        expectWidget('coverStyle', 'select');
        expectWidget('featured', 'boolean');
        expectWidget('draft', 'boolean');
        expectWidget('body', 'markdown');

        const body = field('body');
        const modes = Array.isArray(body?.modes) ? body.modes : [];

        if (!modes.includes('raw') || !modes.includes('rich_text')) {
          fail('CMS config: articles.body must offer both raw and rich_text modes');
        }

        if (field('publishedAt')?.type !== 'date') {
          fail('CMS config: articles.publishedAt must use type "date"');
        }

        if (field('updatedAt')?.type !== 'date') {
          fail('CMS config: articles.updatedAt must use type "date"');
        }

        if (field('seriesOrder')?.value_type !== 'int') {
          fail('CMS config: articles.seriesOrder must use value_type "int"');
        }

        const tagPattern = field('tags')?.field?.pattern?.[0];

        if (tagPattern !== SLUG_REGEX.source) {
          fail('CMS config: articles.tags must use the lowercase URL-safe tag pattern');
        }
      }

      if (name === 'series') {
        expectWidget('description', 'text');
        expectWidget('cover', 'image');
        expectWidget('order', 'number');
        expectWidget('featured', 'boolean');
        expectWidget('parent', 'relation');
        expectWidget('startHere', 'relation');
        expectWidget('draft', 'boolean');

        if (field('order')?.value_type !== 'int') {
          fail('CMS config: series.order must use value_type "int"');
        }

        if (field('startHere')?.multiple !== true) {
          fail('CMS config: series.startHere must allow multiple articles');
        }

        const parentFilters = field('parent')?.filters;

        if (
          !Array.isArray(parentFilters) ||
          !parentFilters.some(
            (filter: any) =>
              filter.field === 'slug' &&
              filter.exclude === true &&
              Array.isArray(filter.values) &&
              filter.values.includes('{{slug}}'),
          )
        ) {
          fail('CMS config: series.parent must exclude the current series from its options');
        }
      }

      if (name === 'pages') {
        expectWidget('description', 'text');
        expectWidget('updatedAt', 'datetime');
        expectWidget('draft', 'boolean');
        expectWidget('body', 'markdown');

        if (field('updatedAt')?.type !== 'date') {
          fail('CMS config: pages.updatedAt must use type "date"');
        }

        const body = field('body');
        const modes = Array.isArray(body?.modes) ? body.modes : [];

        if (!modes.includes('raw') || !modes.includes('rich_text')) {
          fail('CMS config: pages.body must offer both raw and rich_text modes');
        }
      }
    }

    const authMethods = config.backend?.auth_methods;

    if (!Array.isArray(authMethods) || !authMethods.includes('token') || authMethods.includes('oauth')) {
      fail('CMS config: backend.auth_methods must be token-only');
    }

    if (config.output?.omit_empty_optional_fields !== true) {
      fail('CMS config: output.omit_empty_optional_fields must be true');
    }

    if (config.slug?.encoding !== 'ascii') {
      fail('CMS config: slug.encoding must be "ascii"');
    }
  }
}

// ---------------------------------------------------------------------------
// Content tree
// ---------------------------------------------------------------------------

const articlesDir = join(root, model.articles.folder);
const seriesDir = join(root, model.series.folder);
const pagesDir = join(root, model.pages.folder);

const articleSlugs = new Set(listDirs(articlesDir));
const seriesSlugs = new Set(listDirs(seriesDir));
const pageSlugs = new Set(listDirs(pagesDir));

for (const slug of articleSlugs) {
  if (!SLUG_REGEX.test(slug)) fail(`articles: invalid slug "${slug}"`);
}

for (const slug of seriesSlugs) {
  if (!SLUG_REGEX.test(slug)) fail(`series: invalid slug "${slug}"`);
}

for (const slug of pageSlugs) {
  if (!SLUG_REGEX.test(slug)) fail(`pages: invalid slug "${slug}"`);
}

const looseArticleFiles = listMarkdownFiles(articlesDir);
const looseSeriesFiles = listMarkdownFiles(seriesDir);
const loosePageFiles = listMarkdownFiles(pagesDir);

for (const file of looseArticleFiles) {
  fail(`articles: ${file} must live in <slug>/index.md, not directly under the collection folder`);
}

for (const file of looseSeriesFiles) {
  fail(`series: ${file} must live in <slug>/index.md, not directly under the collection folder`);
}

for (const file of loosePageFiles) {
  fail(`pages: ${file} must live in <slug>/index.md, not directly under the collection folder`);
}

const articleEntries = new Map<string, Entry>();
const seriesEntries = new Map<string, Entry>();
const pageEntries = new Map<string, Entry>();

for (const slug of articleSlugs) {
  const path = join(articlesDir, slug, 'index.md');

  if (!isFile(path)) {
    fail(`articles/${slug}: missing index.md`);
    continue;
  }

  const entry = parseEntry(path);

  if (entry) articleEntries.set(slug, entry);
}

for (const slug of seriesSlugs) {
  const path = join(seriesDir, slug, 'index.md');

  if (!isFile(path)) {
    fail(`series/${slug}: missing index.md`);
    continue;
  }

  const entry = parseEntry(path);

  if (entry) seriesEntries.set(slug, entry);
}

for (const slug of pageSlugs) {
  const path = join(pagesDir, slug, 'index.md');

  if (!isFile(path)) {
    fail(`pages/${slug}: missing index.md`);
    continue;
  }

  const entry = parseEntry(path);

  if (entry) pageEntries.set(slug, entry);
}

// Articles
for (const entry of articleEntries.values()) {
  const context = rel(entry.path);
  const title = requireString(entry, 'title');
  const summary = requireString(entry, 'summary');

  if (title && summary && summary === title) {
    warn(`${context}: summary is identical to the title`);
  }

  requireDate(entry, 'publishedAt');
  requireDate(entry, 'updatedAt', { optional: true });
  requireNumber(entry, 'seriesOrder', { optional: true });
  requireBoolean(entry, 'featured');
  requireBoolean(entry, 'draft');

  const language = requireString(entry, 'language', { optional: true });

  if (language && !['kn', 'en'].includes(language)) {
    fail(`${context}: language must be "kn" or "en"`);
  }

  requireString(entry, 'author', { optional: true });

  const series = entry.data.series;

  if (series !== undefined) {
    if (typeof series !== 'string' || !seriesSlugs.has(series)) {
      fail(`${context}: series "${String(series)}" does not exist`);
    }
  }

  const cover = entry.data.cover;

  if (cover !== undefined) {
    if (typeof cover !== 'string') {
      fail(`${context}: cover must be an image path string`);
    } else {
      checkLocalImage(cover, dirname(entry.path), `${context}: cover`);
    }
  }

  requireString(entry, 'coverAlt', { optional: true });

  if (cover !== undefined && entry.data.coverAlt === undefined) {
    warn(`${context}: cover has no coverAlt`);
  }

  if (entry.data.coverAlt !== undefined && cover === undefined) {
    warn(`${context}: coverAlt is set without a cover`);
  }

  const coverStyle = entry.data.coverStyle;

  if (coverStyle !== undefined && !['hero', 'plate'].includes(String(coverStyle))) {
    fail(`${context}: coverStyle must be "hero" or "plate"`);
  }

  const tags = entry.data.tags;

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      fail(`${context}: tags must be an array`);
    } else {
      const seen = new Set<string>();

      for (const tag of tags) {
        if (typeof tag !== 'string' || !SLUG_REGEX.test(tag)) {
          fail(`${context}: invalid tag "${String(tag)}"`);
        } else if (seen.has(tag)) {
          warn(`${context}: duplicate tag "${tag}"`);
        } else {
          seen.add(tag);
        }
      }
    }
  }

  if (entry.body.trim() === '') {
    warn(`${context}: article body is empty`);
  }

  for (const image of extractImages(entry.body)) {
    checkLocalImage(image, dirname(entry.path), `${context}: body image`, { allowExternal: true });
  }
}

// Series
for (const [slug, entry] of seriesEntries) {
  const context = rel(entry.path);

  requireString(entry, 'title');
  requireString(entry, 'titleKn', { optional: true });
  requireString(entry, 'description');
  requireNumber(entry, 'order', { optional: true });
  requireBoolean(entry, 'featured');
  requireBoolean(entry, 'draft');

  const cover = entry.data.cover;

  if (cover !== undefined) {
    if (typeof cover !== 'string') {
      fail(`${context}: cover must be an image path string`);
    } else {
      checkLocalImage(cover, dirname(entry.path), `${context}: cover`);
    }
  }

  const parent = entry.data.parent;

  if (parent !== undefined) {
    if (typeof parent !== 'string' || !seriesSlugs.has(parent)) {
      fail(`${context}: parent series "${String(parent)}" does not exist`);
    } else if (parent === slug) {
      fail(`${context}: series cannot be its own parent`);
    }
  }

  const startHere = entry.data.startHere;

  if (startHere !== undefined) {
    if (!Array.isArray(startHere)) {
      fail(`${context}: startHere must be an array of article slugs`);
    } else {
      const seen = new Set<string>();

      for (const article of startHere) {
        if (typeof article !== 'string' || !articleSlugs.has(article)) {
          fail(`${context}: startHere article "${String(article)}" does not exist`);
        } else if (seen.has(article)) {
          warn(`${context}: duplicate startHere article "${article}"`);
        } else {
          seen.add(article);
        }
      }
    }
  }

  if (entry.body.trim() !== '') {
    warn(`${context}: series body is not rendered by the series page and has no CMS field`);
  }

  for (const image of extractImages(entry.body)) {
    checkLocalImage(image, dirname(entry.path), `${context}: body image`, { allowExternal: true });
  }
}

// Pages
for (const entry of pageEntries.values()) {
  const context = rel(entry.path);

  requireString(entry, 'title');
  requireString(entry, 'description', { optional: true });
  requireDate(entry, 'updatedAt', { optional: true });
  requireBoolean(entry, 'draft');

  if (entry.body.trim() === '') {
    warn(`${context}: page body is empty`);
  }

  for (const image of extractImages(entry.body)) {
    checkLocalImage(image, dirname(entry.path), `${context}: body image`, { allowExternal: true });
  }
}

// A public uploads folder is allowed for intentionally public assets, but content images should
// stay under src/content/. Warn rather than fail so a deliberate global asset does not break CI.
const publicUploads = join(root, 'public/uploads');

if (isDir(publicUploads)) {
  const files = readdirSync(publicUploads, { withFileTypes: true }).filter((entry) =>
    entry.isFile(),
  );

  if (files.length > 0) {
    warn(
      `public/uploads contains ${files.length} file(s); content images should normally live under src/content/`,
    );
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log(
  `CMS model: ${articleEntries.size} articles, ${seriesEntries.size} series, ${pageEntries.size} pages`,
);

if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach((message) => console.log(`  - ${message}`));
}

if (errors.length > 0) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach((message) => console.error(`  - ${message}`));
  process.exitCode = 1;
} else {
  console.log('\nNo data-model errors.');
}
