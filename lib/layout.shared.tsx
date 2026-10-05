import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { APP_URL, GITHUB_URL, SITE_NAME } from '@/lib/site';

export const gitConfig = {
  user: 'vendurepos',
  repo: 'web',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: SITE_NAME,
    },
    githubUrl: GITHUB_URL,
    links: [
      { text: 'Docs', url: '/docs' },
      { text: 'Open the POS', url: APP_URL, external: true },
    ],
  };
}
