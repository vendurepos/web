// The hosted till's /version.json (vendurepos/app#316): exactly these three keys.
export type AppVersion = { version: string; commit: string; builtAt: string };

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const COMMIT = /^[0-9a-f]{40}$/;
const BUILT_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Fetched JSON is untrusted: anything but the exact shape is null, so the line is omitted rather than rendered.
export function parseAppVersion(value: unknown): AppVersion | null {
  if (typeof value !== 'object' || value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const keys = Object.keys(value).sort();
  if (keys.length !== 3 || keys.join() !== 'builtAt,commit,version') return null;
  const { version, commit, builtAt } = value as Record<string, unknown>;
  if (typeof version !== 'string' || version.length > 40 || !VERSION.test(version)) return null;
  if (typeof commit !== 'string' || !COMMIT.test(commit)) return null;
  if (typeof builtAt !== 'string' || !BUILT_AT.test(builtAt) || !Number.isFinite(Date.parse(builtAt))) return null;
  return { version, commit, builtAt };
}

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Round 39, C2/C4 (J1, J2, J4): app and plugin versions were not told apart.
export function appVersionSentence(v: AppVersion): string {
  const date = DATE.format(new Date(v.builtAt));
  return (
    `The hosted till at app.vendurepos.com is till app version ${v.version}, built ${date} from vendurepos/app commit ${v.commit.slice(0, 7)}.` +
    " The till app has its own version number; the releases below are the plugin's."
  );
}

// Local builds and tests only (front desk ruling P6 (c), 2026-11-19): Vercel reads the real ${APP_URL}/version.json.
// Values: demo.vendurepos.com/version.json as served on 2026-11-19 (vendurepos/app#316).
export const LOCAL_APP_VERSION: AppVersion = {
  version: '0.1.0',
  commit: '8483714698ec70a68f569992c646ccd3267b6ec3',
  builtAt: '2026-11-18T23:23:48.356Z',
};
