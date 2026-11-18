import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { APP_URL, DEMO_URL, GITHUB_URL, MEDUSAPOS_URL, NPM_URL, PLUGIN_VERSION, TALLYUI_URL } from '@/lib/site';
import { JsonLd } from '@/components/json-ld';
import { homeJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Captured from the public demo (demo.vendurepos.com/demo); retake when the till UI changes.
const TILL_ALT =
  'The VendurePOS till mid-sale: a product grid on the left, and a cart of three items totalling €59.59 with a Checkout button on the right.';

// Each claim is backed by a test in vendurepos/app; the file is named in the comment beside it. Add a feature here only with its test.
const features = [
  {
    // apps/pos/e2e/offline.spec.ts
    title: 'Keeps selling offline',
    description:
      'Sales made with the network off wait on the till and go to Vendure when it reconnects. Our acceptance run makes 25 sales, 20 of them offline, and checks that Vendure holds exactly 25 orders.',
    test: { label: 'Read the acceptance test', path: 'apps/pos/e2e/offline.spec.ts' },
  },
  {
    // packages/vendure-plugin/test/replay.e2e.ts
    title: 'Every sale lands once',
    description:
      'Each sale carries its own id, and the Vendure plugin records it in one transaction with an idempotency ledger. The same sale sent 200 times makes one order.',
    test: { label: 'Read the 200-send test', path: 'packages/vendure-plugin/test/replay.e2e.ts' },
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
    // apps/pos/e2e/sign-in.spec.ts at 1404f42 ("a split sale, part cash and part card, is applied by the plugin with both payments")
    title: 'Cash, card and receipts',
    description:
      'Take cash with change, or record a payment already taken on your own card terminal. Split a payment between cash and card, and print the receipt from the browser.',
  },
  {
    // apps/pos/lib/use-wedge-scanner.test.ts; apps/pos/lib/barcode-field.test.ts
    title: 'Barcode scanners',
    description:
      'Keyboard-wedge scanners work out of the box, matched against a barcode field you choose on your product variants.',
  },
  {
    // apps/pos/e2e/demo.spec.ts ("a demo cashier parks a sale, sells another, then resumes the parked one")
    title: 'Park a sale, resume it later',
    description:
      'Park the cart to serve the next customer, then resume it from Parked. A parked cart stays on the till over a reload.',
  },
  {
    // apps/pos/e2e/demo.spec.ts ("a demo cashier changes a line's price and sells at it"); apps/pos/lib/price-edit-setting.test.ts
    title: 'Change a line price',
    description:
      'Reprice a line in the cart and sell at that price, with tax on the new price. It stays off on a till until you turn it on in Settings.',
  },
  {
    // apps/pos/e2e/sign-in.spec.ts ("a sale to a searched customer, and one to a new customer, land on those customers in Vendure"); apps/pos/e2e/demo.spec.ts ("a demo visitor attaches a customer and sees it on the receipt")
    title: 'Customers at the till',
    description:
      'Search your Vendure customers or add a new one from the cart. The order lands on that customer, and the receipt names them.',
  },
  {
    // apps/pos/e2e/sign-in.spec.ts ("a discounted sale: line and order discounts, paid, and applied by the plugin with the receipt's totals")
    title: 'Line and order discounts',
    description:
      "Discount a line or the whole sale. The plugin applies the same discounts, and the order in Vendure matches the receipt's totals.",
  },
];

// What the live demo shows next to a real store. Each row names the vendurepos/app tests behind it, like the features above.
const demoParity = [
  {
    // apps/pos/e2e/demo.spec.ts ("the demo signs in with one click, sells, runs a register day, ..."); apps/pos/e2e/sign-in.spec.ts ("Print receipt prints the receipt alone through the browser")
    capability: 'Sell for cash and print the receipt',
    demo: 'Yes',
    store: 'Yes',
  },
  {
    // apps/pos/e2e/demo.spec.ts ("the demo signs in with one click, sells, runs a register day, ..."); apps/pos/e2e/sign-in.spec.ts ("a register day: open with a float, ...")
    capability: 'Open and close a register with a Z report',
    demo: 'Yes',
    store: 'Yes',
  },
  {
    // apps/pos/e2e/demo.spec.ts ("a demo cashier parks a sale, ..."); parked carts stay on the till in both (apps/pos/lib/orders-db.ts, order_drafts)
    capability: 'Park and resume a sale',
    demo: 'Yes',
    store: 'Yes',
  },
  {
    // apps/pos/e2e/demo.spec.ts ("a demo cashier changes a line's price and sells at it"); apps/pos/lib/price-edit-setting.test.ts ("off by default on a real store, on in the demo")
    capability: 'Change a line price',
    demo: 'Yes, on from the start',
    store: 'Yes, once you turn it on for the till in Settings',
  },
  {
    // apps/pos/e2e/demo.spec.ts ("a demo visitor attaches a customer and sees it on the receipt"); apps/pos/e2e/sign-in.spec.ts ("a sale to a searched customer, ...")
    capability: 'Attach a customer to the sale',
    demo: 'Yes, from sample customers',
    store: 'Yes, from your Vendure customers',
  },
  {
    // apps/pos/e2e/demo.spec.ts:628 ("a demo cashier refunds a mug from the order sheet; ..."); packages/vendure-plugin/CHANGELOG.md:8,9,21 (order.refund v1 is Unreleased, 0.3.0 is the latest release; before it an admin refund of a POS order stays Pending until settled by hand)
    capability: 'Refund a sale at the till',
    demo: 'Yes',
    store: 'Not yet: it needs the plugin release after 0.3.0. Until then, refund in the Vendure Dashboard and settle it by hand',
  },
  {
    // apps/pos/e2e/demo.spec.ts:779-781 (the first test asserts no request leaves the page's origin except DEMO_CAPTURE_URL); apps/pos/lib/demo/analytics.ts:3-16,24-36 (anonymous events to ph.wcpos.com on demo.vendurepos.com only, credentials: 'omit', no cookie or storage); apps/pos/e2e/offline.spec.ts; packages/vendure-plugin/test/replay.e2e.ts
    capability: 'Sales reach Vendure, once each, even offline',
    demo: (
      <>
        No: the demo store lives in your browser. All it sends is{' '}
        <Link href="/docs/connect-a-till#where-your-data-goes" className="underline">anonymous usage events</Link>{' '}
        to ph.wcpos.com, with no cookie
      </>
    ),
    store: 'Yes',
  },
];

// Column headings of the demo table; also the data-label each cell shows when the rows stack on phones (app/global.css).
const DEMO_COLUMN = 'Live demo';
const STORE_COLUMN = 'Your Vendure store';

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto w-full px-4">
      <JsonLd data={homeJsonLd()} />
      <section className="pt-20 pb-16 text-center">
        <span className="rounded-md border border-fd-border px-2 py-0.5 text-sm text-fd-muted-foreground">
          {`Pre-release · plugin ${PLUGIN_VERSION}`}
        </span>
        <h1 className="mt-6 mb-6 text-4xl sm:text-5xl font-bold tracking-tight">
          Point of sale for Vendure
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-fd-muted-foreground">
          VendurePOS is an open-source till that runs in the browser and signs in
          to your own Vendure store. It keeps selling when the connection drops,
          and every sale lands in Vendure once, as a normal order at the till&apos;s price.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={DEMO_URL}
            className="rounded-md bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90"
          >
            Live demo
          </a>
          <Link
            href="/docs/quick-start"
            className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent"
          >
            Quick start
          </Link>
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
        <p className="mt-4 text-sm text-fd-muted-foreground">
          Your own store needs the plugin on your Vendure server first: the{' '}
          <Link href="/docs/quick-start" className="underline">quick start</Link> sets it up.
        </p>
        <figure className="mt-12">
          <Image
            src="/till/sale-light.png"
            width={2880}
            height={1800}
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="block dark:hidden rounded-lg border border-fd-border"
            alt={TILL_ALT}
          />
          <Image
            src="/till/sale-dark.png"
            width={2880}
            height={1800}
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="hidden dark:block rounded-lg border border-fd-border"
            alt={TILL_ALT}
          />
          <figcaption className="mt-3 text-sm text-fd-muted-foreground">A sale in progress on the live demo till.</figcaption>
        </figure>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">What it does today</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-fd-border bg-fd-card p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-fd-muted-foreground">{feature.description}</p>
              {feature.test && (
                <a href={`${GITHUB_URL}/blob/main/${feature.test.path}`} className="mt-3 inline-block text-sm underline">
                  {feature.test.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Live demo or your own store</h2>
        <p className="mb-4 text-fd-muted-foreground">
          The <a href={DEMO_URL} className="underline">live demo</a> is the till signed in
          to a simulated store in your browser, with nothing to install. This is what it
          shows today.
        </p>
        <div className="overflow-x-auto">
          <table data-stack="" className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-fd-border">
                <th scope="col" className="py-2 pr-4 font-semibold">At the till</th>
                <th scope="col" className="py-2 pr-4 font-semibold">{DEMO_COLUMN}</th>
                <th scope="col" className="py-2 font-semibold">{STORE_COLUMN}</th>
              </tr>
            </thead>
            <tbody>
              {demoParity.map((row) => (
                <tr key={row.capability} className="border-b border-fd-border align-top">
                  <th scope="row" className="py-2 pr-4 font-medium">{row.capability}</th>
                  <td data-label={DEMO_COLUMN} className="py-2 pr-4 text-fd-muted-foreground">{row.demo}</td>
                  <td data-label={STORE_COLUMN} className="py-2 text-fd-muted-foreground">{row.store}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          {/* vendurepos/app@1404f42 packages/vendure-plugin/CHANGELOG.md:8 (Unreleased: till refunds), :21 (0.3.0 is the latest release); apps/pos/lib/discount-total-matrix.test.ts:171-178 (the till applies no coupons). */}
          <li>
            Coupon codes are not supported yet; line and order discounts work. Refunds at the till
            need the plugin release after 0.3.0, and the live demo has them.
          </li>
        </ul>
        <p className="mt-4 text-fd-muted-foreground">
          The <Link href="/docs/quick-start" className="underline">quick start</Link>{' '}
          walks through the plugin, the migration, CORS and your first sale. See{' '}
          <Link href="/docs/limitations" className="underline">what it does not do yet</Link>.
        </p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-fd-border py-6 text-sm text-fd-muted-foreground">
        <p>
          MIT licensed. Built with{' '}
          <a href={TALLYUI_URL} className="underline">Tally UI</a>. For Medusa, see{' '}
          <a href={MEDUSAPOS_URL} className="underline">MedusaPOS</a>.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href={GITHUB_URL} className="underline">GitHub</a>
          <a href={NPM_URL} className="underline">npm</a>
          <Link href="/docs/limitations" className="underline">Limitations</Link>
          <Link href="/docs/changelog" className="underline">Changelog</Link>
        </div>
      </footer>
    </main>
  );
}
