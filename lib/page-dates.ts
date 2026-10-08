import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// Sitemap lastmod is each page source's last git commit (marketing backlog item 86).
// CI and Vercel build from full history; this map is only a backup without history:
// no git, or a shallow clone whose boundary hides the commit. Values are each file's
// git log -1 --format=%cI on a full clone, checked 2026-10-08.
export const PAGE_DATE_FALLBACK: Record<string, string> = {
  'app/(home)/page.tsx': '2026-10-07T19:39:48+02:00',
  'content/docs/at-the-till.mdx': '2026-10-06T13:05:00+02:00',
  'content/docs/changelog.mdx': '2026-10-07T11:26:38+02:00',
  'content/docs/connect-a-till.mdx': '2026-10-06T13:05:00+02:00',
  'content/docs/index.mdx': '2026-10-06T08:17:42+02:00',
  'content/docs/limitations.mdx': '2026-10-07T19:39:48+02:00',
  'content/docs/plugin-setup.mdx': '2026-10-07T19:39:48+02:00',
  'content/docs/quick-start.mdx': '2026-10-07T19:39:48+02:00',
  'content/docs/troubleshooting.mdx': '2026-10-06T13:05:00+02:00',
};

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

export function pageLastModified(file: string): string | undefined {
  const [hash, date] = git(['log', '-1', '--format=%H %cI', '--', file]).split(' ');
  const shallowPath = git(['rev-parse', '--git-path', 'shallow']);
  const boundaries = existsSync(shallowPath) ? readFileSync(shallowPath, 'utf8').split('\n') : [];
  return date && !boundaries.includes(hash) ? date : PAGE_DATE_FALLBACK[file];
}
