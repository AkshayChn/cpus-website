import type { Image, Paragraph, Root } from 'mdast';
import { visit } from 'unist-util-visit';

const FIGURE_REGEX =
  /^<figure\b[^>]*>\s*(?:<a\b[^>]*>\s*)?<img\b([^>]*?)\/?>\s*(?:<\/a>\s*)?(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>\s*)?<\/figure>$/i;

const decodeHtml = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));

const toText = (value: string): string =>
  decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());

const getAttribute = (attributes: string, name: string): string | undefined => {
  const pattern = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    'i',
  );
  const match = attributes.match(pattern);

  return match ? decodeHtml(match[1] ?? match[2] ?? match[3] ?? '') : undefined;
};

const parseFigure = (value: string): Paragraph | undefined => {
  const match = value.trim().match(FIGURE_REGEX);

  if (!match) return undefined;

  const src = getAttribute(match[1], 'src');

  // Leave absolute/public/external images as HTML. Only entry-relative images need to go through
  // Astro's image pipeline.
  if (!src || src.startsWith('/') || src.startsWith('@') || URL.canParse(src)) {
    return undefined;
  }

  const alt = getAttribute(match[1], 'alt') ?? '';
  const title = getAttribute(match[1], 'title');
  const caption = match[2] ? toText(match[2]) : '';

  const image: Image = {
    type: 'image',
    url: src,
    alt,
    title: caption || title || null,
  };

  // A paragraph holding one image is what a Markdown image on its own line becomes, and what
  // `rehypeFigure` expects when it builds the final `<figure>` + `<figcaption>`.
  return { type: 'paragraph', children: [image] };
};

const BLOCK_PARENT_TYPES = new Set(['root', 'blockquote', 'listItem']);

/**
 * Convert the single-image HTML figure Sveltia CMS saves for a captioned image back into a
 * Markdown image node. Astro collects Markdown images before rendering and sends them through its
 * image pipeline; raw HTML images would be left as-is and never emitted.
 *
 * Sveltia saves a captioned image as:
 *
 *   <figure><img src="fig-01.jpg" alt="..."><figcaption>Caption</figcaption></figure>
 *
 * After this transform, `rehypeFigure` rebuilds the same figure with the optimized image and a
 * plain-text caption.
 */
export function remarkHtmlFigure() {
  return (tree: Root) => {
    visit(tree, 'html', (node, index, parent) => {
      if (!parent || typeof index !== 'number' || !BLOCK_PARENT_TYPES.has(parent.type)) return;

      const figure = parseFigure(node.value);

      if (figure) {
        parent.children[index] = figure;
      }
    });
  };
}
