import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { SITE_URL } from '@/lib/site';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.webp'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

// MDX comments are maintainer notes (source citations) and stay out of the llms text.
const mdxComment = /^\{\/\*[\s\S]*?\*\/\}[ \t]*\n?/gm;
// A <TillFigure> is a React component, so plain-text readers would see raw JSX; give them the light screenshot instead.
const tillFigure = /<TillFigure\s+name="([^"]+)"\s+alt="([^"]*)"\s*\/>/g;
// <Cards> is only a layout wrapper, so its open and close lines go.
const cardsTag = /^[ \t]*<\/?Cards\b[^>]*>[ \t]*\n?/gm;
// A <Card> is a titled link with a short body; it becomes one Markdown list item.
const card = /^[ \t]*<Card\b([^>]*)>([\s\S]*?)<\/Card>/gm;
// A <Callout> is an aside; it becomes a blockquote led by its bold title, if it has one.
const callout = /^[ \t]*<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/gm;
// Site-relative and same-page links break once the text leaves the site, so they become absolute.
const rootLink = /\]\(\//g;
const fragmentLink = /\]\(#/g;

// One JSX string attribute, in any position.
const attr = (attrs: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');
  const text = processed
    .replace(mdxComment, '')
    .replace(tillFigure, `![$2](${SITE_URL}/till/$1-light.png)`)
    .replace(cardsTag, '')
    .replace(card, (_, attrs: string, body: string) => {
      const oneLine = body.trim().split(/\s*\n\s*/).join(' ');
      return `- [${attr(attrs, 'title')}](${attr(attrs, 'href')}): ${oneLine}`;
    })
    .replace(callout, (_, attrs: string, body: string) => {
      const title = attr(attrs, 'title');
      const lines = body.trim().split('\n').map((line) => line.trim());
      if (title) lines[0] = `**${title}:** ${lines[0]}`;
      return lines.map((line) => (line ? `> ${line}` : '>')).join('\n');
    })
    .replace(rootLink, `](${SITE_URL}/`)
    .replace(fragmentLink, `](${SITE_URL}${page.url}#`);

  return `# ${page.data.title}
URL: ${SITE_URL}${page.url}

${text}`;
}
