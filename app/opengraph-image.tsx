import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'takumi-js/response';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

// The social card for pages without their own (the home page); docs pages use app/og/docs.
export const alt = 'VendurePOS: point of sale for Vendure, with the demo till mid-sale';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The site description without its title-like first sentence, so the card does not say the title twice.
const line = SITE_DESCRIPTION.replace(/^[^.]*\.\s*/, '');
// Fumadocs' neutral dark theme: background, foreground, muted foreground and border.
const colors = { bg: 'hsl(0, 0%, 7.04%)', fg: 'hsl(0, 0%, 92%)', muted: 'hsl(0, 0%, 70%)', border: 'hsl(0, 0%, 25%)' };

export default function Image() {
  // A real capture of the demo till (2880×1732), scaled to the card width and cropped at the card's bottom edge.
  const till = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/till/sale-light.png')).toString('base64')}`;
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '48px 64px 0', backgroundColor: colors.bg, color: colors.fg }}>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: 600, color: colors.muted }}>{SITE_NAME}</p>
      <p style={{ margin: 0, marginTop: '12px', fontSize: '60px', fontWeight: 800 }}>Point of sale for Vendure</p>
      <p style={{ margin: 0, marginTop: '12px', fontSize: '28px', lineHeight: 1.3, color: colors.muted }}>{line}</p>
      <div style={{ display: 'flex', marginTop: '36px', flexGrow: 1, overflow: 'hidden', border: `1px solid ${colors.border}`, borderBottom: 'none', borderRadius: '12px 12px 0 0' }}>
        <img src={till} width={1072} height={645} alt="" />
      </div>
    </div>,
    { ...size, format: 'png' },
  );
}
