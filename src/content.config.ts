import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({
    base: './src/content/articles',
    pattern: '**/index.md',
    // Each article is a folder: <slug>/index.md, images live beside it.
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      series: reference('series').optional(),
      language: z.enum(['kn', 'en']).default('kn'),
      author: z.string().default('CPUS'),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

const series = defineCollection({
  loader: glob({
    base: './src/content/series',
    pattern: '**/index.md',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      titleKn: z.string().optional(),
      description: z.string(),
      cover: image().optional(),
      order: z.number().default(0),
      featured: z.boolean().default(false),
      parent: reference('series').optional(),
      startHere: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: '**/*.md',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, series, pages };
