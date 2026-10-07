import { source } from '@/lib/source';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export const revalidate = false;

export async function GET() {
  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push('');
  lines.push(`> ${SITE_DESCRIPTION}`);
  lines.push('');
  lines.push(`- [${SITE_NAME}](${new URL('/', SITE_URL).toString()}): ${SITE_DESCRIPTION}`);
  for (const page of source.getPages()) {
    lines.push(`- [${page.data.title}](${new URL(page.url, SITE_URL).toString()}): ${page.data.description}`);
  }
  lines.push(`- [Full documentation](${new URL('/llms-full.txt', SITE_URL).toString()})`);
  return new Response(lines.join('\n'));
}
