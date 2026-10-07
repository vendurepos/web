import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { Analytics } from '@/components/analytics';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'VendurePOS: open-source point of sale for Vendure',
    template: '%s | VendurePOS',
  },
  description: SITE_DESCRIPTION,
  openGraph: { siteName: SITE_NAME, type: 'website', url: '/' },
  twitter: { card: 'summary_large_image' },
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        {/* Fetch the search dialog when search first opens, not at hydration, to keep it out of every page's initial JS. */}
        <RootProvider search={{ preload: false }}>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
