import { ImageResponse } from '@takumi-rs/image-response';
import { generate as DefaultImage } from 'fumadocs-ui/og/takumi';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

// The social card for pages without their own (the home page); docs pages use app/og/docs.
export const alt = 'VendurePOS: point of sale for Vendure';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <DefaultImage title="Point of sale for Vendure" description={SITE_DESCRIPTION} site={SITE_NAME} />,
    { ...size, format: 'png' },
  );
}
