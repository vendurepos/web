import type { Metadata } from 'next';
import Link from 'next/link';
import { TillFigure } from '@/components/till-figure';
import { DEMO_URL, GITHUB_URL, MEDUSAPOS_URL, NPM_URL, PLUGIN_VERSION, TALLYUI_URL } from '@/lib/site';
import { JsonLd } from '@/components/json-ld';
import { homeJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Captured from the public demo (demo.vendurepos.com/demo); retake when the till UI changes.
// True of both the desktop shot (grid beside the cart) and the phone one (the Products tab, its Cart tab reading
// "Cart (3) · €20.09").
const TILL_ALT =
  'The VendurePOS till mid-sale: the product grid and a cart of three items totalling €20.09.';

// Each claim is backed by a test in vendurepos/app; the file is named in the comment beside it. Add a feature here only with its test.
const features = [
  {
    // apps/pos/e2e/offline.spec.ts; at-the-till.mdx "If the internet drops" and limitations.mdx:47: a reload needs the connection; unsent sales live only in this browser (round 41, J2 C2) (round 58, J1 C1: names the till's browser, not "this site")
    title: 'Keeps selling offline',
    description:
      "With the till's tab left open, sales made with the network off wait on the till and go to Vendure when it reconnects. Until they are sent, those sales live only in the till's browser: a reload needs the connection, and clearing that browser's data for the till loses them. Our acceptance run makes 25 sales, 20 of them offline, and checks that Vendure holds exactly 25 orders.",
    test: { label: 'Read the acceptance test', path: 'apps/pos/e2e/offline.spec.ts' },
  },
  {
    // packages/vendure-plugin/test/replay.e2e.ts
    title: 'Every sale lands once',
    description:
      'Each sale carries its own id, and the Vendure plugin saves that id with the order in one step, so a sale the till sends again never makes a second order. The same sale sent 200 times makes one order.',
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
    title: 'Open and close the register',
    description:
      "Count the cash in the drawer when you open, record cash paid in and out during the day, and close with a Z report, the end-of-day report that prints the closure's own figures.",
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
      'Scanners that type the code like a keyboard (keyboard-wedge scanners) work out of the box, matched against a barcode field you choose on your product variants.',
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
    // Round 45, J2 C2: settling is two Admin API calls (plugin-setup.mdx, Settle a Dashboard refund), so the row says so and links the steps.
    // apps/pos/e2e/demo.spec.ts:628 ("a demo cashier refunds a mug from the order sheet; ..."), apps/pos/lib/demo/store.ts:12 (the demo advertises order.refund); plugin-v0.3.0 (2d3699e) packages/vendure-plugin/src/api/info.controller.ts:29 (no order.refund), src/config/strategies.ts:133-141 (tally-pos has no createRefund); vendurepos/app cc719c2 apps/pos/lib/refund-sheet.tsx:56 (Refund items needs order.refund); https://docs.vendure.io/current/framework/reference/typescript-api/payment/payment-method-config-options (without createRefund, refunds are settled manually by an administrator)
    capability: 'Refund a sale at the till',
    demo: 'Yes',
    store: (
      <>
        No, not on plugin 0.3.0: refund in the Vendure Dashboard. The refund stays Pending until an administrator settles
        it with two Admin API calls; see{' '}
        <Link href="/docs/plugin-setup#settle-a-dashboard-refund" className="underline">
          Plugin setup
        </Link>
        .
      </>
    ),
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
      <section className="pt-20 pb-16 text-left sm:text-center">
        {/* Round 32, J4 C1: below 640px the hero is left-aligned and its lead one size smaller; from sm up it is centred as before. */}
        <span className="rounded-md border border-fd-border px-2 py-0.5 text-sm text-fd-muted-foreground">
          {`Pre-release · plugin ${PLUGIN_VERSION}`}
        </span>
        <h1 className="mt-6 mb-6 text-4xl sm:text-5xl font-bold tracking-tight">
          Point of sale for Vendure
        </h1>
        {/* Round 42, J1 C1: the hero names who it is for. Round 43, J4 C1: three sentences; the guarantee lives on the 'Every sale lands once' card. */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-fd-muted-foreground">
          VendurePOS is an open-source till for <a href="https://vendure.io" className="underline">Vendure</a>,
          {/* Source: https://docs.vendure.io/ "The open source headless commerce framework, community plugins, and the commercial paid plans, all in one place." (read 2026-11-18) */}
          {' '}the open-source headless commerce framework. It is made for shops that sell online with Vendure and
          also sell in person. It runs in the browser and keeps selling when the connection drops.
        </p>
        <div className="mt-8 flex flex-wrap justify-start sm:justify-center gap-3">
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
        </div>
        {/* Round 40, J4 C1: the note overhung the lede's measure. */}
        {/* Round 71, J4 C1: balanced lines, so the note does not end on an orphan. */}
        <p className="mt-4 max-w-2xl mx-auto text-sm text-balance text-fd-muted-foreground">
          Your own store needs the plugin on your Vendure server first: the{' '}
          <Link href="/docs/quick-start" className="underline">quick start</Link> sets it up, then signs the till in and makes a
          sale.
        </p>
        {/* Round 11, C6: TillFigure serves the phone capture (the Cart tab) below 640px. */}
        <TillFigure name="sale" alt={TILL_ALT} sizes="(min-width: 1024px) 1024px, 100vw" eager className="mt-12">
          <figcaption className="mt-3 text-sm text-fd-muted-foreground">A sale in progress on the live demo till.</figcaption>
        </TillFigure>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">What it does today</h2>
        {/* Round 45, J4 C5 and J1 C1, P5 (front desk, 2026-11-19): the two test-backed claims lead as cards; the other eight are a frameless checklist. */}
        {/* Round 48, J4 C5: the cards are flex columns and the buttons sit at the bottom, so the two line up. */}
        <div className="grid gap-4 sm:grid-cols-2">
          {features.filter((feature) => feature.test).map((feature) => (
            <div key={feature.title} className="flex flex-col rounded-lg border border-fd-border bg-fd-card p-5">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 mb-4 text-sm text-fd-muted-foreground">{feature.description}</p>
              {feature.test && (
                <a
                  href={`${GITHUB_URL}/blob/main/${feature.test.path}`}
                  className="mt-auto self-start inline-block rounded-md border border-fd-border px-4 py-2 text-sm hover:bg-fd-accent"
                >
                  {feature.test.label}
                </a>
              )}
            </div>
          ))}
        </div>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {features.filter((feature) => !feature.test).map((feature) => (
            <li key={feature.title}>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-fd-muted-foreground">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Live demo or your own store</h2>
        <p className="mb-4 text-fd-muted-foreground">
          The <a href={DEMO_URL} className="underline">live demo</a> is the till signed in
          to a simulated store in your browser, with nothing to install. This is what it
          shows today.
        </p>
        <div className="overflow-x-auto">
          {/* Round 12, C5: fixed columns from 640px up. 34% (337px of the 992px column) fits the longest row label,
              302px plus padding, on one line. Round 13, C5: the two answer columns split the rest evenly (33% each,
              about 327px), because the demo caveat and the store refund note are the two long answers, one in each. */}
          <table data-stack="" className="w-full text-left text-sm sm:table-fixed">
            <thead>
              <tr className="border-b border-fd-border">
                <th scope="col" className="py-2 pr-4 font-semibold sm:w-[34%]">At the till</th>
                <th scope="col" className="py-2 pr-4 font-semibold sm:w-[33%]">{DEMO_COLUMN}</th>
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
        {/* Round 49, J2 C1, J4 and J1 C5: the counter's needs come first, apart from the store setup; the lists match the page's text-sm body; the page ends on the hero's two buttons. */}
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold">At the counter</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-fd-muted-foreground space-y-1">
              <li>A web till for now. The app is pre-release: expect changes before 1.0.</li>
              {/* Same facts as content/docs/limitations.mdx:15, :30-31, :39, :41-42 (sources in its comments at :10-11). */}
              <li>
                A browser on the till&apos;s device, one tab per till and not a private window. Its browser
                tests run in desktop Chrome; tablets and phones, an iPad included, are not tested yet. Receipts print through
                the browser&apos;s print dialog; the till does not open a
                cash drawer. See <Link href="/docs/limitations" className="underline">Limitations</Link>.
              </li>
              {/* plugin-v0.3.0 (2d3699e, npm latest) packages/vendure-plugin/src/api/info.controller.ts:29 (no order.refund); vendurepos/app cc719c2 apps/pos/lib/refund-sheet.tsx:56 (Refund items needs order.refund), apps/pos/lib/demo/store.ts:12 (the demo advertises it); vendurepos/app@1404f42 apps/pos/lib/discount-total-matrix.test.ts:171-178 (the till applies no coupons). */}
              <li>
                Coupon codes are not supported yet; line and order discounts work. On plugin 0.3.0,
                refunds go through the Vendure Dashboard; the live demo also refunds at the till.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Setting up the store</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-fd-muted-foreground space-y-1">
              {/* plugin-v0.3.0 packages/vendure-plugin/package.json:41-42 (peerDependencies @vendure/core ^3.6.0) */}
              <li>
                Vendure 3.6 or a later 3.x release on Postgres (tested on 3.7.3). MySQL, MariaDB and
                SQLite are not supported.
              </li>
              {/* plugin-v0.3.0 packages/vendure-plugin/package.json:27-28 (engines); quick-start.mdx and plugin-setup.mdx:9 say the same. */}
              <li>Node <code>^20.19 || &gt;=22.12</code> on the server that runs Vendure.</li>
              <li>
                The <a href={NPM_URL} className="underline">@vendurepos/plugin</a> package
                on npm, added to your Vendure config.
              </li>
              {/* vendurepos/app cc719c2 LICENSE:1 (MIT License), README.md:72-74 (RxDB Premium install needs the token in RXDB_PREMIUM), apps/pos/package.json:44 (rxdb-premium 17.5.0); content/docs/connect-a-till.mdx:50-52 and content/docs/limitations.mdx:16-17 say the same. */}
              <li>
                The till&apos;s source is MIT licensed. To build and host it yourself instead of using app.vendurepos.com, you
                need your own RxDB Premium licence token (<code>RXDB_PREMIUM</code>); see{' '}
                <Link href="/docs/connect-a-till" className="underline">Connect a till</Link>.
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-fd-muted-foreground">
          The <Link href="/docs/quick-start" className="underline">quick start</Link>{' '}
          walks through the plugin, the migration, CORS and your first sale. For cashiers,{' '}
          <Link href="/docs/at-the-till" className="underline">At the till</Link> covers
          selling, taking payment and closing the day. See{' '}
          <Link href="/docs/limitations" className="underline">what it does not do yet</Link>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={DEMO_URL} className="rounded-md bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90">Live demo</a>
          <Link href="/docs/quick-start" className="rounded-md border border-fd-border px-6 py-3 hover:bg-fd-accent">Quick start</Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-fd-border py-6 text-sm text-fd-muted-foreground">
        <p>
          MIT licensed. Built with{' '}
          <a href={TALLYUI_URL} className="underline">TallyUI</a>. For Medusa, see{' '}
          <a href={MEDUSAPOS_URL} className="underline">MedusaPOS</a>.
        </p>
        {/* Round 55, J5 C6: each footer link is at least 44 px tall so it is an easy tap target on a phone. */}
        <div className="flex flex-wrap gap-x-6">
          <a href={GITHUB_URL} className="inline-flex min-h-11 items-center underline">GitHub</a>
          <a href={NPM_URL} className="inline-flex min-h-11 items-center underline">npm</a>
          <Link href="/docs/limitations" className="inline-flex min-h-11 items-center underline">Limitations</Link>
          <Link href="/docs/changelog" className="inline-flex min-h-11 items-center underline">Changelog</Link>
        </div>
      </footer>
    </main>
  );
}
