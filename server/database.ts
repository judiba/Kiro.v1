import { Database } from 'bun:sqlite';

const db = new Database('tasks.db', { create: true });

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1'
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS priorities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#ef4444'
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
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
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Usuário',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer', 'editor', 'admin')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login TEXT
  )
`);

// Seed default data
function seedData() {
  const categoryCount = db
    .query('SELECT COUNT(*) as count FROM categories')
    .get() as { count: number };

  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, color) VALUES (?, ?)',
    );
    insertCategory.run('Desenvolvimento', '#6366f1');
    insertCategory.run('Design', '#ec4899');
    insertCategory.run('Marketing', '#f59e0b');
    insertCategory.run('Infraestrutura', '#10b981');
    insertCategory.run('Pesquisa', '#8b5cf6');
  }

  const priorityCount = db
    .query('SELECT COUNT(*) as count FROM priorities')
    .get() as { count: number };

  if (priorityCount.count === 0) {
    const insertPriority = db.prepare(
      'INSERT INTO priorities (name, level, color) VALUES (?, ?, ?)',
    );
    insertPriority.run('Baixa', 1, '#22c55e');
    insertPriority.run('Média', 2, '#f59e0b');
    insertPriority.run('Alta', 3, '#ef4444');
    insertPriority.run('Urgente', 4, '#dc2626');
  }

  // Seed admin user (password: admin123)
  const userCount = db.query('SELECT COUNT(*) as count FROM users').get() as {
    count: number;
  };

  if (userCount.count === 0) {
    const hashPassword = (password: string): string => {
      // Simple hash using SubtleCrypto (not for production - use bcrypt for real apps)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      return btoa(String.fromCharCode(...new Uint8Array(data)));
    };

    const insertUser = db.prepare(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    );
    insertUser.run(
      'admin',
      'admin@taskflow.local',
      hashPassword('admin123'),
      'admin',
    );
    insertUser.run(
      'editor',
      'editor@taskflow.local',
      hashPassword('editor123'),
      'editor',
    );
    insertUser.run(
      'viewer',
      'viewer@taskflow.local',
      hashPassword('viewer123'),
      'viewer',
    );
  }

  const taskCount = db.query('SELECT COUNT(*) as count FROM tasks').get() as {
    count: number;
  };

  if (taskCount.count === 0) {
    const insertTask = db.prepare(
      'INSERT INTO tasks (title, description, status, priority_id, category_id, due_date) VALUES (?, ?, ?, ?, ?, ?)',
    );

    insertTask.run(
      'Criar componente de autenticação',
      'Implementar login com OAuth2 e JWT tokens para a aplicação principal. Incluir refresh token e logout.',
      'todo',
      3,
      1,
      '2026-06-15',
    );
    insertTask.run(
      'Redesign da página inicial',
      'Atualizar o layout da homepage seguindo o novo design system. Incluir hero section, features e testimonials.',
      'in_progress',
      2,
      2,
      '2026-06-10',
    );
    insertTask.run(
      'Configurar pipeline CI/CD',
      'Setup completo do GitHub Actions com testes automatizados, lint, build e deploy para staging.',
      'todo',
      4,
      4,
      '2026-06-08',
    );
    insertTask.run(
      'Campanha de lançamento Q3',
      'Preparar materiais de marketing para o lançamento do produto no terceiro trimestre. Incluir landing page e email marketing.',
      'done',
      2,
      3,
      '2026-06-01',
    );
    insertTask.run(
      'Pesquisa de mercado - concorrentes',
      'Análise detalhada dos 5 principais concorrentes, incluindo features, pricing e posicionamento de mercado.',
      'in_progress',
      1,
      5,
      '2026-06-20',
    );

    // Seed some comments
    const insertComment = db.prepare(
      'INSERT INTO comments (task_id, content, author) VALUES (?, ?, ?)',
    );
    insertComment.run(
      1,
      'Precisamos definir qual provider OAuth2 usar primeiro.',
      'Ana Silva',
    );
    insertComment.run(
      1,
      'Sugiro usar Google e GitHub como providers iniciais.',
      'Carlos Mendes',
    );
    insertComment.run(
      2,
      'Os mockups estão prontos no Figma, link compartilhado no Slack.',
      'Maria Costa',
    );
    insertComment.run(
      3,
      'Verificar se precisamos de ambiente de staging separado.',
      'João Pedro',
    );
    insertComment.run(
      5,
      'Relatório parcial disponível na pasta compartilhada.',
      'Fernanda Lima',
    );
  }
}

seedData();

export default db;
