import { describe, expect, test } from 'bun:test';
import type { Root } from 'mdast';

import { remarkHtmlFigure } from './remark-html-figure';

const process = (value: string): Root => {
  const tree: Root = {
    type: 'root',
    children: [{ type: 'html', value }],
  };

  remarkHtmlFigure()(tree);

  return tree;
};

describe('remarkHtmlFigure', () => {
  test('converts a captioned HTML figure into a paragraph image', () => {
    const tree = process(
      '<figure><img src="fig-01.jpg" alt="A field of millet"><figcaption>Millet at the edge of the field.</figcaption></figure>',
    );

    expect(tree.children[0]).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'image',
          url: 'fig-01.jpg',
          alt: 'A field of millet',
          title: 'Millet at the edge of the field.',
        },
      ],
    });
  });

  test('handles a linked image and strips HTML from the caption', () => {
    const tree = process(
      '<figure><a href="https://example.com"><img src="./fig-02.jpg" alt="A plant"></a><figcaption>Photo by <a href="https://example.com/jane">Jane Doe</a></figcaption></figure>',
    );

    expect(tree.children[0]).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'image',
          url: './fig-02.jpg',
          alt: 'A plant',
          title: 'Photo by Jane Doe',
        },
      ],
    });
  });

  test('decodes HTML entities in attributes and captions', () => {
    const tree = process(
      '<figure><img src="fig-03.jpg" alt="Salt &amp; pepper"><figcaption>Tomato &amp; soil</figcaption></figure>',
    );

    expect(tree.children[0]).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'image',
          url: 'fig-03.jpg',
          alt: 'Salt & pepper',
          title: 'Tomato & soil',
        },
      ],
    });
  });

  test('leaves public and external images as HTML', () => {
    const publicFigure =
      '<figure><img src="/uploads/fig-01.jpg" alt="Public"><figcaption>Caption</figcaption></figure>';
    const externalFigure =
      '<figure><img src="https://example.com/fig-01.jpg" alt="External"><figcaption>Caption</figcaption></figure>';

    expect(process(publicFigure).children[0]).toEqual({ type: 'html', value: publicFigure });
    expect(process(externalFigure).children[0]).toEqual({ type: 'html', value: externalFigure });
  });

  test('converts a figure inside a blockquote', () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'blockquote',
          children: [
            {
              type: 'html',
              value:
                '<figure><img src="fig-04.jpg" alt="Quoted"><figcaption>Quoted caption</figcaption></figure>',
            },
          ],
        },
      ],
    };

    remarkHtmlFigure()(tree);

    expect(tree.children[0]).toEqual({
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'fig-04.jpg',
              alt: 'Quoted',
              title: 'Quoted caption',
            },
          ],
        },
      ],
    });
  });

  test('leaves unrelated HTML untouched', () => {
    const value = '<div class="note">Not a figure</div>';

    expect(process(value).children[0]).toEqual({ type: 'html', value });
  });

  test('does not convert a figure with more than one image', () => {
    const value =
      '<figure><img src="a.jpg" alt="A"><img src="b.jpg" alt="B"><figcaption>Two</figcaption></figure>';

    expect(process(value).children[0]).toEqual({ type: 'html', value });
  });
});
