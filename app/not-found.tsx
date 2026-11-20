import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { DEMO_URL } from '@/lib/site';
import { source } from '@/lib/source';

export const metadata: Metadata = { title: 'Page not found', description: 'There is no page at this address.' };

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="max-w-5xl mx-auto w-full px-4">
        <section className="pt-20 pb-16 text-center">
          <h1 className="mb-6 text-4xl sm:text-5xl font-bold tracking-tight">Page not found</h1>
          <p className="max-w-2xl mx-auto text-lg text-fd-muted-foreground">
            There is no page at this address. It may have moved, or the link may be wrong.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-md bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90">Home</Link>
            <Link href="/docs" className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent">Docs</Link>
            <a href={DEMO_URL} className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent">Live demo</a>
          </div>
          <nav aria-label="Docs pages" className="mt-12">
            <h2 className="mb-3 text-sm font-medium text-fd-muted-foreground">Or go straight to a docs page</h2>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {source.getPageTree().children.map((node) =>
                node.type === 'page' ? (
                  <li key={node.url}>
                    <Link href={node.url} className="text-fd-primary underline-offset-4 hover:underline">{node.name}</Link>
                  </li>
                ) : null,
              )}
            </ul>
          </nav>
        </section>
      </main>
    </HomeLayout>
  );
}
