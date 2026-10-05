import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
        Beta
      </div>
      <h1 className="mb-4 text-5xl font-bold tracking-tight">MedusaPOS</h1>
      <p className="mb-8 max-w-md text-lg text-fd-muted-foreground">
        Open source, modular point of sale for MedusaJS. Run on any device.
        Connect to your Medusa backend.
      </p>
      <div className="flex gap-4">
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground hover:bg-fd-primary/90"
        >
          Documentation
        </Link>
        <a
          href="https://demo.medusapos.com"
          className="rounded-lg border border-fd-border px-6 py-3 hover:bg-fd-accent"
        >
          Live Demo
        </a>
      </div>
      <div className="mt-12 flex gap-8 text-sm text-fd-muted-foreground">
        <span>iOS &amp; Android</span>
        <span>Web</span>
        <span>Desktop</span>
        <span>Local-first</span>
      </div>
    </main>
  );
}
