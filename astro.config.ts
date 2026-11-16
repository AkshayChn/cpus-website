import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import { rehypeFigure } from './src/lib/rehype-figure';
import { remarkHtmlFigure } from './src/lib/remark-html-figure';

// The custom domain serves the site from the root.
// BASE_PATH can still override this for project-site previews.
export default defineConfig({
  site: 'https://channesh.org',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkHtmlFigure],
      rehypePlugins: [rehypeSlug, rehypeFigure],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
