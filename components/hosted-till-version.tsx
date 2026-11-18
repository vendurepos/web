import { appVersionSentence, LOCAL_APP_VERSION, parseAppVersion, type AppVersion } from '@/lib/app-version';
import { APP_URL } from '@/lib/site';

async function readAppVersion(): Promise<AppVersion | null> {
  if (!process.env.VERCEL) return LOCAL_APP_VERSION;
  try {
    const res = await fetch(`${APP_URL}/version.json`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return parseAppVersion(await res.json());
  } catch {
    return null;
  }
}

// Front desk ruling P6 (c), 2026-11-19: on Vercel the line is read from the hosted till's own /version.json (hourly),
// validated before it renders and rendered as text; a timeout, error or bad shape omits it and never fails the build.
export async function HostedTillVersion() {
  const v = await readAppVersion();
  return v ? <p>{appVersionSentence(v)}</p> : null;
}
