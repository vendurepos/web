// The canonical origin of this site; metadataBase, the sitemap and robots use it.
export const SITE_URL = 'https://vendurepos.com';
// The hosted POS (vendurepos/app QUICKSTART names this origin for CORS since app#108).
export const APP_URL = 'https://app.vendurepos.com';
// The hosted live demo: /demo signs in to a demo Vendure store on its own, so one click opens a working till.
export const DEMO_URL = 'https://demo.vendurepos.com/demo';
// The product's source (app and Vendure plugin).
export const GITHUB_URL = 'https://github.com/vendurepos/app';
export const NPM_URL = 'https://www.npmjs.com/package/@vendurepos/plugin';
// The published @vendurepos/plugin version the site tells stores to install (vendurepos/app tag plugin-v0.3.0).
// The install lines in content/docs/quick-start.mdx and plugin-setup.mdx repeat it; tests/plugin-version.test.mjs keeps them equal.
export const PLUGIN_VERSION = '0.3.0';
// The UI toolkit this app is built with.
export const TALLYUI_URL = 'https://tallyui.com';
// The sibling open-source POS, for Medusa.
export const MEDUSAPOS_URL = 'https://medusapos.com';
export const SITE_NAME = 'VendurePOS';
export const SITE_DESCRIPTION =
  'Open-source point of sale for Vendure. Sell from the browser, keep selling offline, and every sale lands in Vendure once, as a normal order.';
