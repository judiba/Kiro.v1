import { Elysia, t } from 'elysia';
import db from '../database';

export const taskRoutes = new Elysia({ prefix: '/api/tasks' })
  .get('/', () => {
    const tasks = db
      .query(
        `
      SELECT t.*, c.name as category_name, c.color as category_color, 
             p.name as priority_name, p.level as priority_level, p.color as priority_color
      FROM tasks t
      JOIN categories c ON t.category_id = c.id
      JOIN priorities p ON t.priority_id = p.id
      ORDER BY t.created_at DESC
    `,
      )
      .all();
    return tasks;
  })
  .get(
    '/:id',
    ({ params }) => {
      const task = db
        .query(
          `
      SELECT t.*, c.name as category_name, c.color as category_color,
             p.name as priority_name, p.level as priority_level, p.color as priority_color
      FROM tasks t
      JOIN categories c ON t.category_id = c.id
      JOIN priorities p ON t.priority_id = p.id
      WHERE t.id = ?
    `,
        )
        .get(params.id);

      if (!task) return new Response('Task not found', { status: 404 });
      return task;
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  )
  .post(
    '/',
    ({ body }) => {
      const result = db
        .query(
          `INSERT INTO tasks (title, description, status, priority_id, category_id, due_date) 
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
        )
        .get(
          body.title,
          body.description || '',
          body.status || 'todo',
          body.priority_id,
          body.category_id,
          body.due_date || null,
        );
      return result;
    },
    {
      body: t.Object({
        title: t.String(),
        description: t.Optional(t.String()),
        status: t.Optional(t.String()),
        priority_id: t.Number(),
        category_id: t.Number(),
        due_date: t.Optional(t.String()),
      }),
    },
  )
  .put(
    '/:id',
    ({ params, body }) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (body.title !== undefined) {
        fields.push('title = ?');
        values.push(body.title);
      }
      if (body.description !== undefined) {
        fields.push('description = ?');
        values.push(body.description);
      }
      if (body.status !== undefined) {
        fields.push('status = ?');
        values.push(body.status);
      }
      if (body.priority_id !== undefined) {
        fields.push('priority_id = ?');
        values.push(body.priority_id);
      }
      if (body.category_id !== undefined) {
        fields.push('category_id = ?');
        values.push(body.category_id);
      }
      if (body.due_date !== undefined) {
        fields.push('due_date = ?');
        values.push(body.due_date);
      }

      fields.push("updated_at = datetime('now')");
      values.push(params.id);

      const result = db
        .query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
        .get(...values);

      if (!result) return new Response('Task not found', { status: 404 });
      return result;
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        status: t.Optional(t.String()),
        priority_id: t.Optional(t.Number()),
        category_id: t.Optional(t.Number()),
        due_date: t.Optional(t.String()),
      }),
    },
  )
  .patch(
    '/:id/status',
    ({ params, body }) => {
      const result = db
        .query(
          `UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`,
        )
        .get(body.status, params.id);

      if (!result) return new Response('Task not found', { status: 404 });
      return result;
    },
    {
      params: t.Object({ id: t.Numeric() }),
      body: t.Object({ status: t.String() }),
    },
  )
  .delete(
    '/:id',
    ({ params }) => {
      const result = db
        .query('DELETE FROM tasks WHERE id = ? RETURNING id')
        .get(params.id);
      if (!result) return new Response('Task not found', { status: 404 });
      return { success: true, id: params.id };
    },
    {
      params: t.Object({ id: t.Numeric() }),
    },
  );
