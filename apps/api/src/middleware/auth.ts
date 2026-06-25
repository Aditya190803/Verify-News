import type { Context, Next } from 'hono';

export type AuthVars = { userId?: string };

/** Resolve user id: Bearer (Stack) → optional dev header */
export async function resolveUserId(c: Context): Promise<string | undefined> {
  const auth = c.req.header('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    const fromStack = await verifyStackAccessToken(token);
    if (fromStack) return fromStack;
  }

  if (process.env.AUTH_TRUST_HEADER === 'true') {
    return c.req.header('x-user-id')?.trim();
  }
  return undefined;
}

async function verifyStackAccessToken(token: string): Promise<string | undefined> {
  const projectId = process.env.STACK_PROJECT_ID;
  if (!projectId) return undefined;

  const urls = [
    `https://api.stack-auth.com/api/v1/users/me`,
    `https://api.stack-auth.com/api/v1/auth/users/me`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Stack-Project-Id': projectId,
          'X-Stack-Access-Type': 'client',
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { id?: string; user_id?: string };
      return data.id ?? data.user_id;
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function authMiddleware(c: Context, next: Next) {
  const userId = await resolveUserId(c);
  if (userId) c.set('userId', userId);
  await next();
}

export async function requireAuth(c: Context, next: Next) {
  const userId = await resolveUserId(c);
  if (!userId) return c.json({ error: 'unauthorized' }, 401);
  c.set('userId', userId);
  await next();
}