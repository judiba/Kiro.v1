import { Elysia } from 'elysia';

// Simple JWT implementation for development
const JWT_SECRET = 'taskflow-secret-key-change-in-production';

function createToken(userId: number, username: string, role: string): string {
  const payload = {
    userId,
    username,
    role,
    iat: Math.floor(Date.now() / 1000),
  };
  const encodedPayload = btoa(JSON.stringify(payload));
  return `${encodedPayload}.${btoa(JWT_SECRET)}`;
}

function verifyToken(
  token: string,
): { userId: number; username: string; role: string } | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (signature !== btoa(JWT_SECRET)) return null;

    const payload = JSON.parse(atob(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function createAuthPlugin() {
  return new Elysia({ name: 'auth' })
    .derive({ as: 'global' }, ({ headers }) => {
      const authHeader = headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = verifyToken(token);
        return { user };
      }
      return { user: null };
    })
    .onBeforeHandle(({ headers }) => {
      const authHeader = headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = verifyToken(token);
        return { user };
      }
      return { user: null };
    });
}

export { createToken, verifyToken };
