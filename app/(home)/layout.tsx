import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  const base = baseOptions();
  // Round 44, J1 C6 and J2 C6: below 640 px Fumadocs hides the header links behind the menu chevron; Docs stays visible.
  return (
    <HomeLayout {...base} nav={{ ...base.nav, children: (
      <Link href="/docs" className="sm:hidden ms-3 text-sm text-fd-muted-foreground hover:text-fd-accent-foreground">Docs</Link>
    ) }}>
      {children}
    </HomeLayout>
  );
}
