import { stackClientApp, isStackAuthConfigured } from '@/config/stackAuth';

export async function getStackAccessToken(): Promise<string | undefined> {
  if (!isStackAuthConfigured() || !stackClientApp) return undefined;
  try {
    const t = await stackClientApp.getAccessToken();
    return t.accessToken;
  } catch {
    return undefined;
  }
}