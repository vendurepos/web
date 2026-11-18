import { getImageProps } from 'next/image';
import type { ReactNode } from 'react';

// public/till/<name>-{light,dark}.png are live demo till captures (#62) at 1440x900, deviceScaleFactor 2;
// <name>-phone-{light,dark}.png are the same states at 390x844, deviceScaleFactor 2 (cashier cropped to its sheet).
// Round 11, C6: a 1440px shot shrunk to a phone is unreadable, so below 640px a <picture> serves the phone capture.
const PHONE_HEIGHT: Record<string, number> = { sale: 1688, payment: 1688, cashier: 688 };

function TillPicture({ name, scheme, alt, sizes, eager, className }: {
  name: string; scheme: 'light' | 'dark'; alt: string; sizes: string; eager?: boolean; className: string;
}) {
  const priority = eager ? ({ loading: 'eager', fetchPriority: 'high' } as const) : {};
  const phone = getImageProps({ src: `/till/${name}-phone-${scheme}.png`, width: 780, height: PHONE_HEIGHT[name], sizes: '100vw', alt, ...priority }).props;
  const wide = getImageProps({ src: `/till/${name}-${scheme}.png`, width: 2880, height: 1800, sizes, alt, ...priority }).props;
  return (
    <picture className={className}>
      <source media="(max-width: 639px)" srcSet={phone.srcSet} sizes={phone.sizes} width={phone.width} height={phone.height} />
      <img {...wide} alt={alt} className="block rounded-lg border border-fd-border" />
    </picture>
  );
}

// A live demo till capture in light and dark, as on the home page.
export function TillFigure({ name, alt, sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px', eager, className, children }: {
  name: string; alt: string; sizes?: string; eager?: boolean; className?: string; children?: ReactNode;
}) {
  return (
    <figure className={className}>
      <TillPicture name={name} scheme="light" alt={alt} sizes={sizes} eager={eager} className="block dark:hidden" />
      <TillPicture name={name} scheme="dark" alt={alt} sizes={sizes} className="hidden dark:block" />
      {children}
    </figure>
  );
}
