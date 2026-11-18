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

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed.replace(mdxComment, '').replace(tillFigure, `![$2](${SITE_URL}/till/$1-light.png)`)}`;
}
