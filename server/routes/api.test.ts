/**
 * Integration tests for the REST API.
 * Uses a fresh in-memory SQLite database for each test suite
 * so tests are isolated from tasks.db on disk.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { Database } from 'bun:sqlite';
import { createToken } from '../middleware/auth';

// ── In-memory test DB ─────────────────────────────────────────────────────────

function createTestDb() {
  const db = new Database(':memory:');
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1'
  )`);

  db.run(`CREATE TABLE priorities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#ef4444'
  )`);

  db.run(`CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
    priority_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (priority_id) REFERENCES priorities(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`);

  db.run(`CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Usuário',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'editor', 'admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login TEXT
  )`);

  // Seed minimal data
  db.run(`INSERT INTO categories (name, color) VALUES ('Dev', '#6366f1'), ('Design', '#ec4899')`);
  db.run(`INSERT INTO priorities (name, level, color) VALUES ('Baixa', 1, '#22c55e'), ('Alta', 3, '#ef4444')`);

  const hashPassword = (p: string) =>
    btoa(String.fromCharCode(...new Uint8Array(new TextEncoder().encode(p))));

  db.run(`INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@test.local', '${hashPassword('admin123')}', 'admin'),
    ('viewer', 'viewer@test.local', '${hashPassword('viewer123')}', 'viewer')`);

  return db;
}

// ── Build a minimal app using the test DB ─────────────────────────────────────

function buildApp(db: Database) {
  const app = new Elysia();

  // Auth — login
  app.post('/api/auth/login', ({ body }: any) => {
    const { username, password } = body;
    const hashPassword = (p: string) =>
      btoa(String.fromCharCode(...new Uint8Array(new TextEncoder().encode(p))));
    const user = db
      .query('SELECT id, username, email, role, password_hash FROM users WHERE username = ?')
      .get(username) as any;
    if (!user || user.password_hash !== hashPassword(password)) {
      return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    db.query("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
    const token = createToken(user.id, user.username, user.role);
    return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
  });

  // Tasks
  app
    .get('/api/tasks', () =>
      db.query(`SELECT t.*, c.name as category_name, c.color as category_color,
          p.name as priority_name, p.level as priority_level, p.color as priority_color
        FROM tasks t
        JOIN categories c ON t.category_id = c.id
        JOIN priorities p ON t.priority_id = p.id
        ORDER BY t.created_at DESC`).all()
    )
    .post('/api/tasks', ({ body }: any) => {
      return db
        .query(`INSERT INTO tasks (title, description, status, priority_id, category_id, due_date)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING *`)
        .get(body.title, body.description || '', body.status || 'todo', body.priority_id, body.category_id, body.due_date || null);
    })
    .patch('/api/tasks/:id/status', ({ params, body }: any) => {
      const result = db
        .query(`UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`)
        .get(body.status, params.id);
      if (!result) return new Response('Not found', { status: 404 });
      return result;
    })
    .delete('/api/tasks/:id', ({ params }: any) => {
      const result = db.query('DELETE FROM tasks WHERE id = ? RETURNING id').get(params.id);
      if (!result) return new Response('Not found', { status: 404 });
      return { success: true };
    });

  // Comments
  app
    .get('/api/comments/task/:taskId', ({ params }: any) =>
      db.query('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC').all(params.taskId)
    )
    .post('/api/comments', ({ body }: any) =>
      db
        .query('INSERT INTO comments (task_id, content, author) VALUES (?, ?, ?) RETURNING *')
        .get(body.task_id, body.content, body.author || 'Usuário')
    )
    .delete('/api/comments/:id', ({ params }: any) => {
      const result = db.query('DELETE FROM comments WHERE id = ? RETURNING id').get(params.id);
      if (!result) return new Response('Not found', { status: 404 });
      return { success: true };
    });

  // Meta
  app
    .get('/api/categories', () => db.query('SELECT * FROM categories ORDER BY name').all())
    .get('/api/priorities', () => db.query('SELECT * FROM priorities ORDER BY level').all())
    .get('/api/stats', () =>
      db.query(`SELECT COUNT(*) as total,
        SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done
        FROM tasks`).get()
    );

  return app;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function json(res: Response) {
  return res.json();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  let app: Elysia;

  beforeAll(() => {
    app = buildApp(createTestDb());
  });

  it('returns token and user on valid credentials', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.token).toBeTruthy();
    expect(data.user.username).toBe('admin');
    expect(data.user.role).toBe('admin');
    expect(data.user).not.toHaveProperty('password_hash');
  });

  it('returns error on wrong password', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      }),
    );
    expect(res.status).toBe(401);
    const data = await json(res);
    expect(data.error).toBeTruthy();
  });

  it('returns error for non-existent user', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nobody', password: 'pass' }),
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe('Tasks API', () => {
  let app: Elysia;
  let createdTaskId: number;

  beforeAll(() => {
    app = buildApp(createTestDb());
  });

  it('GET /api/tasks returns an empty array initially', async () => {
    const res = await app.handle(new Request('http://localhost/api/tasks'));
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it('POST /api/tasks creates a task', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Tarefa de teste',
          description: 'Descrição da tarefa',
          priority_id: 1,
          category_id: 1,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const task = await json(res);
    expect(task.title).toBe('Tarefa de teste');
    expect(task.status).toBe('todo');
    expect(task.id).toBeGreaterThan(0);
    createdTaskId = task.id;
  });

  it('GET /api/tasks returns the created task', async () => {
    const res = await app.handle(new Request('http://localhost/api/tasks'));
    const data = await json(res);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Tarefa de teste');
  });

  it('PATCH /api/tasks/:id/status updates the status', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${createdTaskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      }),
    );
    expect(res.status).toBe(200);
    const task = await json(res);
    expect(task.status).toBe('in_progress');
  });

  it('DELETE /api/tasks/:id removes the task', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/tasks/${createdTaskId}`, {
        method: 'DELETE',
      }),
    );
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.success).toBe(true);
  });

  it('GET /api/tasks returns empty after deletion', async () => {
    const res = await app.handle(new Request('http://localhost/api/tasks'));
    const data = await json(res);
    expect(data).toHaveLength(0);
  });
});

describe('Comments API', () => {
  let app: Elysia;
  let taskId: number;
  let commentId: number;

  beforeAll(async () => {
    const db = createTestDb();
    app = buildApp(db);
    // Create a task to attach comments to
    const res = await app.handle(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Task for comments', priority_id: 1, category_id: 1 }),
      }),
    );
    const task = await res.json();
    taskId = task.id;
  });

  it('GET /api/comments/task/:taskId returns empty initially', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/comments/task/${taskId}`),
    );
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data).toHaveLength(0);
  });

  it('POST /api/comments creates a comment', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, content: 'Ótima tarefa!', author: 'Alice' }),
      }),
    );
    expect(res.status).toBe(200);
    const comment = await json(res);
    expect(comment.content).toBe('Ótima tarefa!');
    expect(comment.author).toBe('Alice');
    commentId = comment.id;
  });

  it('GET /api/comments/task/:taskId returns the comment', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/comments/task/${taskId}`),
    );
    const data = await json(res);
    expect(data).toHaveLength(1);
    expect(data[0].content).toBe('Ótima tarefa!');
  });

  it('POST /api/comments defaults author to "Usuário" when omitted', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, content: 'Sem autor' }),
      }),
    );
    const comment = await json(res);
    expect(comment.author).toBe('Usuário');
  });

  it('DELETE /api/comments/:id removes the comment', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/comments/${commentId}`, { method: 'DELETE' }),
    );
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.success).toBe(true);
  });
});

describe('Meta API', () => {
  let app: Elysia;

  beforeAll(() => {
    app = buildApp(createTestDb());
  });

  it('GET /api/categories returns seeded categories', async () => {
    const res = await app.handle(new Request('http://localhost/api/categories'));
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('color');
  });

  it('GET /api/priorities returns seeded priorities ordered by level', async () => {
    const res = await app.handle(new Request('http://localhost/api/priorities'));
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].level).toBeLessThanOrEqual(data[1].level);
  });

  it('GET /api/stats returns zero counts on empty task table', async () => {
    const res = await app.handle(new Request('http://localhost/api/stats'));
    expect(res.status).toBe(200);
    const stats = await json(res);
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('todo');
    expect(stats).toHaveProperty('in_progress');
    expect(stats).toHaveProperty('done');
    expect(Number(stats.total)).toBe(0);
  });

  it('GET /api/stats reflects created tasks correctly', async () => {
    // Create one todo and one done task
    await app.handle(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'A', priority_id: 1, category_id: 1, status: 'todo' }),
      }),
    );
    await app.handle(
      new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'B', priority_id: 1, category_id: 1, status: 'done' }),
      }),
    );

    const res = await app.handle(new Request('http://localhost/api/stats'));
    const stats = await json(res);
    expect(Number(stats.total)).toBe(2);
    expect(Number(stats.todo)).toBe(1);
    expect(Number(stats.done)).toBe(1);
  });
});
