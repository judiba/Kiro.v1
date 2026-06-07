import { Elysia, t } from 'elysia';
import db from '../database';

export const commentRoutes = new Elysia({ prefix: '/api/comments' })
  .get(
    '/task/:taskId',
    ({ params }) => {
      const comments = db
        .query(
          'SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC',
        )
        .all(params.taskId);
      return comments;
    },
    {
      params: t.Object({ taskId: t.Numeric() }),
    },
  )
  .post(
    '/',
    ({ body }) => {
      const result = db
        .query(
          'INSERT INTO comments (task_id, content, author) VALUES (?, ?, ?) RETURNING *',
        )
        .get(body.task_id, body.content, body.author || 'Usuário');
      return result;
    },
    {
      body: t.Object({
        task_id: t.Number(),
        content: t.String(),
        author: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    '/:id',
    ({ params }) => {
      const result = db
        .query('DELETE FROM comments WHERE id = ? RETURNING id')
        .get(params.id);
      if (!result) return new Response('Comment not found', { status: 404 });
      return { success: true };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  );
