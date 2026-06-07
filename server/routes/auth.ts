import { Elysia, t } from 'elysia';
import db from '../database';
import { createToken, verifyToken } from '../middleware/auth';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post(
    '/login',
    async ({ body }) => {
      const { username, password } = body;

      // Simple password hash (not for production)
      const hashPassword = (pwd: string): string => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pwd);
        return btoa(String.fromCharCode(...new Uint8Array(data)));
      };

      const user = db
        .query(
          'SELECT id, username, email, role, password_hash FROM users WHERE username = ?',
        )
        .get(username) as
        | {
            id: number;
            username: string;
            email: string;
            role: string;
            password_hash: string;
          }
        | undefined;

      if (!user) {
        return { error: 'Credenciais inválidas' };
      }

      const storedHash = user.password_hash;
      const providedHash = hashPassword(password);

      if (storedHash !== providedHash) {
        return { error: 'Credenciais inválidas' };
      }

      // Update last login
      db.query(
        "UPDATE users SET last_login = datetime('now') WHERE id = ?",
      ).run(user.id);

      const token = createToken(user.id, user.username, user.role);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      response: {
        200: t.Object({
          token: t.String(),
          user: t.Object({
            id: t.Number(),
            username: t.String(),
            email: t.String(),
            role: t.String(),
          }),
        }),
        401: t.Object({ error: t.String() }),
      },
    },
  )
  .get('/me', ({ user }) => {
    if (!user) return { error: 'Não autenticado' };
    return { id: user.userId, username: user.username, role: user.role };
  });

export function requireAuth({ user }: any) {
  if (!user) {
    return { error: 'Não autenticado' };
  }
  return null;
}

export function requireRole(minRole: string) {
  return ({ user }: any) => {
    if (!user) {
      return { error: 'Não autenticado' };
    }

    const roleHierarchy: Record<string, number> = {
      viewer: 1,
      editor: 2,
      admin: 3,
    };
    if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
      return { error: 'Acesso negado' };
    }
    return null;
  };
}
