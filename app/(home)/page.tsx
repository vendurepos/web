import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_URL, DEMO_URL, GITHUB_URL, NPM_URL } from '@/lib/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Each claim is backed by a test in vendurepos/app; the file is named in the comment beside it. Add a feature here only with its test.
const features = [
  {
    // apps/pos/e2e/offline.spec.ts
    title: 'Keeps selling offline',
    description:
      'Sales made with the network off wait on the till and go to Vendure when it reconnects. Our acceptance run makes 25 sales, 20 of them offline, and checks that Vendure holds exactly 25 orders.',
  },
  {
    // packages/vendure-plugin/test/replay.e2e.ts
    title: 'Every sale lands once',
    description:
      'Each sale carries its own id, and the Vendure plugin records it in one transaction with an idempotency ledger. The same sale sent 200 times makes one order.',
  },
  {
    // apps/pos/e2e/offline.spec.ts; packages/vendure-plugin/test/price-strategy.e2e.ts
    title: "Paid, fulfilled, at the till's price",
    description:
      "POS orders keep the price the cashier charged, arrive with a settled payment and a delivered fulfilment, and take the stock down. Your storefront keeps its own pricing.",
  },
  {
    // packages/vendure-plugin/test/register.e2e.ts; apps/pos/lib/z-report.test.ts
    title: 'Registers and Z reports',
    description:
      "Open a register with a counted float, record cash movements, and close it with a Z report that prints the closure's own figures.",
  },
  {
    // apps/pos/e2e/sign-in.spec.ts
    title: 'Cash, card and receipts',
    description:
      'Take cash with change, or record a payment already taken on your own card terminal. Print the receipt from the browser.',
  },
  {
    // apps/pos/lib/use-wedge-scanner.test.ts; apps/pos/lib/barcode-field.test.ts
    title: 'Barcode scanners',
    description:
      'Keyboard-wedge scanners work out of the box, matched against a barcode field you choose on your product variants.',
  },
];

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto w-full px-4">
      <section className="pt-20 pb-16 text-center">
        <span className="rounded-md border border-fd-border px-2 py-0.5 text-sm text-fd-muted-foreground">
          Pre-release · plugin 0.1.0
        </span>
        <h1 className="mt-6 mb-6 text-4xl sm:text-5xl font-bold tracking-tight">
          Point of sale for Vendure
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-fd-muted-foreground">
          VendurePOS is an open-source till that runs in the browser and signs in
          to your own Vendure store. It keeps selling when the connection drops,
          and every sale lands in Vendure once, as a normal order at the till's price.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/quick-start"
            className="rounded-md bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90"
          >
            Quick start
          </Link>
          <a
            href={DEMO_URL}
            className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent"
          >
            Live demo
          </a>
          <a
            href={APP_URL}
            className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent"
          >
            Try with your store
          </a>
          <a
            href={GITHUB_URL}
            className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">What it does today</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-fd-border bg-fd-card p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Before you start</h2>
        <ul className="list-disc pl-5 text-fd-muted-foreground space-y-1">
          <li>
            Vendure 3.6 or later on Postgres (tested on 3.7.3). MySQL, MariaDB and
            SQLite are not supported.
          </li>
          <li>
            The <a href={NPM_URL} className="underline">@vendurepos/plugin</a> package
            on npm, added to your Vendure config.
          </li>
          <li>A web till for now. The app is pre-release: expect changes before 1.0.</li>
        </ul>
        <p className="mt-4 text-fd-muted-foreground">
          The <Link href="/docs/quick-start" className="underline">quick start</Link>{' '}
          walks through the plugin, the migration, CORS and your first sale.
        </p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-fd-border py-6 text-sm text-fd-muted-foreground">
        <p>
          MIT licensed. Built on{' '}
          <a href="https://github.com/TallyUI/tallyui" className="underline">TallyUI</a>.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href={GITHUB_URL} className="underline">GitHub</a>
          <a href={NPM_URL} className="underline">npm</a>
        </div>
      </footer>
    </main>
  );
}
