import { getImageProps } from 'next/image';
import type { ReactNode } from 'react';

// public/till/<name>-{light,dark}.png are live demo till captures (#62) at deviceScaleFactor 2 (sale 1440x866);
// <name>-phone-{light,dark}.png are the same states at 390x844, deviceScaleFactor 2 (sale at 390x665 on the Products
// tab; cashier cropped to its sheet). Round 35, J1/J2/J4/J5 C6: the phone cart's header truncated "Qty"; J4 C5: the
// desktop shot ended mid-row. Both now end on whole rows.
// Round 11, C6: a 1440px shot shrunk to a phone is unreadable, so below 640px a <picture> serves the phone capture.
// Round 33, J2 C4: closure is the dialog alone after closing the register (512x504 CSS px; phone 390x444).
// Round 46, J1 C6: the phone hero ends after the first product row (780x950), so the page's first section comes sooner.
const PHONE_HEIGHT: Record<string, number> = { sale: 950, payment: 1688, cashier: 688, closure: 888 };
// Round 15, C5: a full 1440px window shrunk to the 836px docs column put the till's text at 7px. payment is a 900x820
// capture right of the nav rail (836x820 CSS px), cashier is the sheet alone (384x306); sale stays the full window.
// The wide image never renders wider than its CSS size, so a DPR 2 capture is shown 1:1 and not blown up.
const WIDE_SIZE: Record<string, [number, number]> = { sale: [2880, 1732], payment: [1672, 1640], cashier: [768, 612], closure: [1024, 1008] };
// Captions live here, not as MDX props, so lib/source.ts still turns each docs <TillFigure> into a Markdown image.
// The home page passes its own <figcaption> as children.
const CAPTION: Record<string, string> = {
  payment: 'The payment screen on the live demo till.', cashier: 'The cashier sheet on the live demo till.',
  closure: 'The closure screen on the live demo till.',
};
// Round 34, J4 C5: closure is the dialog alone with its own border, so it gets no second border.
const OWN_BORDER = new Set(['closure']);

function TillPicture({ name, scheme, alt, sizes, eager, className }: {
  name: string; scheme: 'light' | 'dark'; alt: string; sizes: string; eager?: boolean; className: string;
}) {
  const priority = eager ? ({ loading: 'eager', fetchPriority: 'high' } as const) : {};
  const phone = getImageProps({ src: `/till/${name}-phone-${scheme}.png`, width: 780, height: PHONE_HEIGHT[name], sizes: '100vw', alt, ...priority }).props;
  const [width, height] = WIDE_SIZE[name];
  const wide = getImageProps({ src: `/till/${name}-${scheme}.png`, width, height, sizes, alt, ...priority }).props;
  // A narrow shot's <picture> takes the img's width attribute as its flex width, so mx-auto centres the img in it.
  const imgClass = `block rounded-lg${OWN_BORDER.has(name) ? '' : ' border border-fd-border'}${width / 2 < 600 ? ' mx-auto' : ''}`;
  return (
    <picture className={className}>
      <source media="(max-width: 639px)" srcSet={phone.srcSet} sizes={phone.sizes} width={phone.width} height={phone.height} />
      <img {...wide} alt={alt} style={{ ...wide.style, maxWidth: `min(100%, ${width / 2}px)` }} className={imgClass} />
    </picture>
  );
}

// A live demo till capture in light and dark, as on the home page.
export function TillFigure({ name, alt, sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px', eager, className, children }: {
  name: string; alt: string; sizes?: string; eager?: boolean; className?: string; children?: ReactNode;
}) {
  const caption = CAPTION[name];
  const pictures = (
    <>
      <TillPicture name={name} scheme="light" alt={alt} sizes={sizes} eager={eager} className="block dark:hidden" />
      <TillPicture name={name} scheme="dark" alt={alt} sizes={sizes} className="hidden dark:block" />
    </>
  );
  // Round 34, J4 C5: narrow shots sit centred, not left-aligned. Round 36, J2/J4 C5: a column-wide panel left them
  // tiny in empty grey, so the panel hugs the shot (its CSS width + 2 × 16 px padding + 2 × 1 px border).
  // Below 640px the phone captures (390 CSS px for cashier and closure) fit under that maxWidth (418, 546), so the phone
  // shot is no narrower than before.
  const width = WIDE_SIZE[name][0];
  const narrow = width / 2 < 600;
  const hug = narrow ? { maxWidth: width / 2 + 34 } : undefined;
  // Round 37, J4 C5: a narrow shot's caption sat at the column's left edge, not under its panel.
  return (
    <figure className={className}>
      {narrow ? <div className="sm:mx-auto sm:flex sm:justify-center sm:rounded-lg sm:border sm:border-fd-border sm:bg-fd-muted sm:p-4" style={hug}>{pictures}</div> : pictures}
      {caption && <figcaption className={`mt-3 text-sm text-fd-muted-foreground${narrow ? ' sm:mx-auto' : ''}`} style={hug}>{caption}</figcaption>}
      {children}
    </figure>
  );
}
