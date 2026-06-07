import { Elysia, t } from 'elysia';
import db from '../database';

export const userRoutes = new Elysia({ prefix: '/api/users' })
  .onBeforeHandle(({ headers, set }) => {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401;
      throw new Error('Não autenticado');
    }

    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(atob(token.split('.')[0]));
      const role = payload.role;

      if (role !== 'admin') {
        set.status = 403;
        throw new Error('Acesso negado');
      }
    } catch (e) {
      set.status = 401;
      throw new Error('Token inválido');
    }
  })
  .get('/', () => {
    const users = db
      .query(
        'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC',
      )
      .all();
    return users;
  })
  .get(
    '/:id',
    ({ params }) => {
      const user = db
        .query(
          'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?',
        )
        .get(params.id);
      if (!user) return { error: 'Usuário não encontrado' };
      return user;
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  .put(
    '/:id',
    ({ params, body }) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (body.username !== undefined) {
        fields.push('username = ?');
        values.push(body.username);
      }
      if (body.email !== undefined) {
        fields.push('email = ?');
        values.push(body.email);
      }
      if (body.role !== undefined) {
        fields.push('role = ?');
        values.push(body.role);
      }

      if (fields.length > 0) {
        values.push(params.id);
        const result = db
          .query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
          )
          .get(...values);
        if (!result) return { error: 'Usuário não encontrado' };
        return result;
      }
      return { error: 'Nenhum campo para atualizar' };
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        username: t.Optional(t.String()),
        email: t.Optional(t.String()),
        role: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    '/:id',
    ({ params }) => {
      const result = db
        .query('DELETE FROM users WHERE id = ? RETURNING id')
        .get(params.id);
      if (!result) return { error: 'Usuário não encontrado' };
      return { success: true };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  .post(
    '/',
    ({ body, set }) => {
      const { username, email, password, role } = body;

      // Validate role — only editor or viewer allowed via this endpoint
      if (role !== 'editor' && role !== 'viewer') {
        set.status = 400;
        return { error: 'Role inválido. Permitido: editor ou viewer' };
      }

      // Simple password hash (same scheme used in auth login)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const password_hash = btoa(String.fromCharCode(...new Uint8Array(data)));

      try {
        const user = db
          .query(
            `INSERT INTO users (username, email, password_hash, role)
             VALUES (?, ?, ?, ?)
             RETURNING id, username, email, role, created_at`,
          )
          .get(username, email, password_hash, role) as {
          id: number;
          username: string;
          email: string;
          role: string;
          created_at: string;
        };
        return user;
      } catch (err: any) {
        if (err?.message?.includes('UNIQUE')) {
          set.status = 409;
          return { error: 'Username ou email já está em uso' };
        }
        set.status = 500;
        return { error: 'Erro ao criar usuário' };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 6 }),
        role: t.Union([t.Literal('editor'), t.Literal('viewer')]),
      }),
    },
  );
