import { visit } from 'unist-util-visit';
import type { Element, ElementContent, Root } from 'hast';

function isImage(node: ElementContent): node is Element {
  return node.type === 'element' && node.tagName === 'img';
}

function isWhitespace(node: ElementContent): boolean {
  return node.type === 'text' && node.value.trim() === '';
}

function toFigure(image: Element): Element {
  const title = image.properties?.title;
  delete image.properties?.title;

  const children: ElementContent[] = [image];

  if (typeof title === 'string' && title.length > 0) {
    children.push({
      type: 'element',
      tagName: 'figcaption',
      properties: {},
      children: [{ type: 'text', value: title }],
    });
  }

  return {
    type: 'element',
    tagName: 'figure',
    properties: {},
    children,
  };
}

/**
 * Turn a Markdown image on its own line into a semantic figure:
 *
 *   ![alt](image.jpg "Caption")
 *
 * becomes <figure><img ...><figcaption>Caption</figcaption></figure>.
 * Images without a title still become figures, just without a caption.
 */
export function rehypeFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (node.tagName !== 'p') return;

      const meaningful = node.children.filter((child) => !isWhitespace(child));
      if (meaningful.length !== 1 || !isImage(meaningful[0])) return;

      parent.children[index] = toFigure(meaningful[0]);
    });
  };
}
