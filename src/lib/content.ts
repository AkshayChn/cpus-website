import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;
export type Series = CollectionEntry<'series'>;
export type Page = CollectionEntry<'pages'>;

function isPublished(entry: { data: { draft: boolean } }): boolean {
  return import.meta.env.DEV || !entry.data.draft;
}

function byNewest(a: Article, b: Article): number {
  return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
}

export async function getArticles(): Promise<Article[]> {
  const entries = await getCollection('articles', isPublished);
  return entries.sort(byNewest);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((entry) => entry.id === slug);
}

export async function getFeaturedArticles(limit = 1): Promise<Article[]> {
  const articles = await getArticles();
  return articles.filter((entry) => entry.data.featured).slice(0, limit);
}

export async function getSeries(): Promise<Series[]> {
  const entries = await getCollection('series', isPublished);
  return entries.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

export async function getSeriesBySlug(slug: string): Promise<Series | undefined> {
  const entries = await getSeries();
  return entries.find((entry) => entry.id === slug);
}

export async function getSeriesMap(): Promise<Map<string, Series>> {
  const entries = await getSeries();
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export async function getSeriesChildren(parent: string): Promise<Series[]> {
  const entries = await getSeries();
  return entries.filter((entry) => entry.data.parent?.id === parent);
}

export async function getArticlesBySeries(series: string, limit?: number): Promise<Article[]> {
  const articles = await getArticles();
  const filtered = articles.filter((entry) => entry.data.series?.id === series);
  return typeof limit === 'number' ? filtered.slice(0, limit) : filtered;
}

export async function getStartHereArticles(series: Series): Promise<Article[]> {
  if (series.data.startHere.length === 0) return [];
  const articles = await getArticles();
  const bySlug = new Map(articles.map((entry) => [entry.id, entry]));
  return series.data.startHere
    .map((slug) => bySlug.get(slug))
    .filter((entry): entry is Article => Boolean(entry));
}

export async function getRelatedArticles(article: Article, limit = 3): Promise<Article[]> {
  const articles = await getArticles();
  const sameSeries = article.data.series
    ? articles.filter(
        (entry) =>
          entry.id !== article.id && entry.data.series?.id === article.data.series?.id,
      )
    : [];

  const related = sameSeries.slice(0, limit);
  if (related.length >= limit) return related;

  const fallback = articles.filter(
    (entry) => entry.id !== article.id && !related.some((item) => item.id === entry.id),
  );
  return [...related, ...fallback].slice(0, limit);
}

export function readingTime(article: Article): number {
  const body = article.body ?? '';
  const text = body.replace(/<[^>]+>/g, ' ').replace(/[#*_>`~[\]()]/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
