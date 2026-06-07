import { Elysia } from 'elysia';
import db from '../database';

export const metaRoutes = new Elysia({ prefix: '/api' })
  .get('/categories', () => {
    return db.query('SELECT * FROM categories ORDER BY name').all();
  })
  .get('/priorities', () => {
    return db.query('SELECT * FROM priorities ORDER BY level').all();
  })
  .get('/stats', () => {
    const stats = db
      .query(
        `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks
    `,
      )
      .get();
    return stats;
  });
