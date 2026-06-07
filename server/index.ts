import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { taskRoutes } from './routes/tasks';
import { commentRoutes } from './routes/comments';
import { metaRoutes } from './routes/meta';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { join } from 'path';

const app = new Elysia()
  .use(cors())
  .use(authRoutes)
  .use(userRoutes)
  .use(taskRoutes)
  .use(commentRoutes)
  .use(metaRoutes)
  .get('/', () => Bun.file(join(import.meta.dir, '../public/index.html')))
  .get('/assets/*', ({ params }) => {
    const filePath = join(import.meta.dir, '../public/assets', params['*']);
    return Bun.file(filePath);
  })
  .listen(3000);

console.log(`🚀 Servidor rodando em http://localhost:${app.server?.port}`);
