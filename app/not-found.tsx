import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { DEMO_URL } from '@/lib/site';

export const metadata: Metadata = { title: 'Page not found' };

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
        </section>
      </main>
    </HomeLayout>
  );
}
