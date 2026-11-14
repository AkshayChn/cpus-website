import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

/**
 * Turn Markdown images with a title into semantic figures:
 *
 *   ![alt](image.jpg "Caption")
 *
 * becomes <figure><img ...><figcaption>Caption</figcaption></figure>.
 */
export function rehypeFigure() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'img') return;
      if (!parent || typeof index !== 'number') return;

      const title = node.properties?.title;
      if (typeof title !== 'string' || title.length === 0) return;

      delete node.properties.title;

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: {},
        children: [
          node,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: title }],
          },
        ],
      };

      parent.children[index] = figure;
    });
  };
}
