import { getImageProps } from 'next/image';
import type { ReactNode } from 'react';

// public/till/<name>-{light,dark}.png are live demo till captures (#62) at deviceScaleFactor 2 (sale 1440x900);
// <name>-phone-{light,dark}.png are the same states at 390x844, deviceScaleFactor 2 (sale at 390x700, round 33
// J4 C6: 664 clipped the cart's Add charge; cashier cropped to its sheet).
// Round 11, C6: a 1440px shot shrunk to a phone is unreadable, so below 640px a <picture> serves the phone capture.
const PHONE_HEIGHT: Record<string, number> = { sale: 1400, payment: 1688, cashier: 688 };
// Round 15, C5: a full 1440px window shrunk to the 836px docs column put the till's text at 7px. payment is a 900x820
// capture right of the nav rail (836x820 CSS px), cashier is the sheet alone (384x306); sale stays the full window.
// The wide image never renders wider than its CSS size, so a DPR 2 capture is shown 1:1 and not blown up.
const WIDE_SIZE: Record<string, [number, number]> = { sale: [2880, 1800], payment: [1672, 1640], cashier: [768, 612] };
// Captions live here, not as MDX props, so lib/source.ts still turns each docs <TillFigure> into a Markdown image.
// The home page passes its own <figcaption> as children.
const CAPTION: Record<string, string> = {
  payment: 'The payment screen on the live demo till.', cashier: 'The cashier sheet on the live demo till.',
};

function TillPicture({ name, scheme, alt, sizes, eager, className }: {
  name: string; scheme: 'light' | 'dark'; alt: string; sizes: string; eager?: boolean; className: string;
}) {
  const priority = eager ? ({ loading: 'eager', fetchPriority: 'high' } as const) : {};
  const phone = getImageProps({ src: `/till/${name}-phone-${scheme}.png`, width: 780, height: PHONE_HEIGHT[name], sizes: '100vw', alt, ...priority }).props;
  const [width, height] = WIDE_SIZE[name];
  const wide = getImageProps({ src: `/till/${name}-${scheme}.png`, width, height, sizes, alt, ...priority }).props;
  return (
    <picture className={className}>
      <source media="(max-width: 639px)" srcSet={phone.srcSet} sizes={phone.sizes} width={phone.width} height={phone.height} />
      <img {...wide} alt={alt} style={{ ...wide.style, maxWidth: `min(100%, ${width / 2}px)` }} className="block rounded-lg border border-fd-border" />
    </picture>
  );
}

// A live demo till capture in light and dark, as on the home page.
export function TillFigure({ name, alt, sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px', eager, className, children }: {
  name: string; alt: string; sizes?: string; eager?: boolean; className?: string; children?: ReactNode;
}) {
  const caption = CAPTION[name];
  return (
    <figure className={className}>
      <TillPicture name={name} scheme="light" alt={alt} sizes={sizes} eager={eager} className="block dark:hidden" />
      <TillPicture name={name} scheme="dark" alt={alt} sizes={sizes} className="hidden dark:block" />
      {caption && <figcaption className="mt-3 text-sm text-fd-muted-foreground">{caption}</figcaption>}
      {children}
    </figure>
  );
}
