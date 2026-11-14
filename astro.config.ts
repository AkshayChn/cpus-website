import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import { rehypeFigure } from './src/lib/rehype-figure';

// GitHub Pages project site previews are served from /cpus-website/.
// Set BASE_PATH=/cpus-website in CI; local development stays at /.
export default defineConfig({
  site: 'https://akshaychn.github.io',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeSlug, rehypeFigure],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
