# TaskFlow — Gestão de Tarefas

Aplicativo web moderno de gestão de tarefas estilo Kanban, construído 100% no ecossistema **Bun** sem dependência de Node.js, Vite ou Webpack.

![Bun](https://img.shields.io/badge/Runtime-Bun%201.3-f9a825?style=flat-square&logo=bun)
![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=flat-square&logo=react)
![Elysia](https://img.shields.io/badge/Backend-ElysiaJS-7c3aed?style=flat-square)
![SQLite](https://img.shields.io/badge/DB-SQLite-003b57?style=flat-square&logo=sqlite)

---

## Funcionalidades

- **Kanban Board** com 3 colunas: A Fazer, Em Progresso, Concluída
- **Drag and Drop** para mover tarefas entre colunas (somente administradores)
- **5 tarefas de exemplo** pré-carregadas com comentários
- **Contadores de status** em tempo real no header
- **Cards interativos** com título, categoria, prioridade, data de vencimento e botões de ação (editar, excluir, mover status)
- **Modal de criação/edição** reutilizável com campos: título, descrição, prioridade, categoria e data de vencimento
- **Modal de detalhes** com descrição completa, metadados, ações e seção de notas/comentários
- **Diálogo de confirmação** antes de qualquer exclusão
- **Ícones Phosphor** para uma interface limpa e moderna
- **Dashboard Admin** para criação e gerenciamento de usuários (somente role `admin`)

---

## Dashboard Admin

Acessível exclusivamente por usuários com role `admin` via ícone 🛡️ no header.

### Funcionalidades

- **Cards de resumo** — total de usuários, quantidade de editors e viewers
- **Tabela de usuários** — avatar, username, email, role badge colorido, data de criação e último login
- **Criar usuário** — modal com validação inline (username, email, senha, confirmação de senha e role)
- **Excluir usuário** — com diálogo de confirmação; a exclusão de admins é bloqueada na UI
- **Roles disponíveis para criação**: `editor` e `viewer` (admins são criados diretamente no banco)

### Regras de acesso

| Role    | Acesso ao dashboard |
| ------- | ------------------- |
| admin   | ✅ Completo          |
| editor  | ❌ Negado            |
| viewer  | ❌ Negado            |

Todas as rotas `/api/users` exigem token JWT com role `admin`. Tentativas de acesso com outra role retornam `403 Forbidden`.

---

## Drag and Drop

A funcionalidade de arrastar e soltar permite que **administradores** movam tarefas entre as colunas do Kanban de forma intuitiva.

### Suporte a Mouse (HTML5 Drag and Drop)

- Clique e arraste o ícone de seis pontos (⠿) no canto do card
- Solte sobre a coluna de destino para alterar o status
- A coluna de destino é destacada visualmente durante o arraste
- Pressione **Escape** a qualquer momento para cancelar

### Suporte a Toque (Dispositivos Móveis)

- Mantenha pressionado o card por **500ms** para iniciar o arraste
- Movimentos verticais acima de 10px antes dos 500ms são interpretados como scroll
- O preview do card acompanha a posição do toque

### Navegação por Teclado

- **Enter** ou **Espaço** no drag handle para ativar o modo arrastar
- **Seta Esquerda / Direita** para navegar entre colunas
- **Enter** para confirmar o drop na coluna selecionada
- **Escape** para cancelar a operação

### Atualização Otimista com Rollback

O card é movido imediatamente para a coluna de destino (atualização otimista). Se a requisição ao servidor falhar ou exceder **5 segundos** de timeout, a tarefa é automaticamente restaurada à posição original e uma mensagem de erro é exibida.

### Acessibilidade

- **Região ARIA live** anuncia o estado do drag para leitores de tela
- Atributo `aria-roledescription="arrastar tarefa"` no drag handle
- Navegação completa por teclado (Enter, Setas, Escape)
- Botões de navegação de status (setas) mantidos como alternativa ao drag and drop
- Cada botão possui `aria-label` descritivo (ex: "Mover para Em Progresso")

### Permissões

A funcionalidade de drag and drop está disponível **apenas para administradores**. Usuários com outras roles veem o cursor padrão e não podem arrastar os cards.

---

## Stack Tecnológica

| Camada            | Tecnologia                                  |
| ----------------- | ------------------------------------------- |
| Runtime & Bundler | Bun (build nativo + servidor)               |
| Frontend          | React 19 + Tailwind CSS v4 + Phosphor Icons |
| Backend           | ElysiaJS                                    |
| Banco de Dados    | SQLite nativo (`bun:sqlite`)                |

Sem dependências externas de banco de dados — tudo roda com o SQLite embutido no Bun.

---

## Estrutura do Projeto

```
├── server/                        # Backend (ElysiaJS + SQLite)
│   ├── index.ts                   # Entry point, configura rotas e serve estáticos
│   ├── database.ts                # Conexão SQLite, schema e seed data
│   ├── middleware/
│   │   └── auth.ts                # Plugin JWT (criação/verificação de tokens)
│   └── routes/
│       ├── auth.ts                # Login e /me
│       ├── tasks.ts               # CRUD de tarefas
│       ├── comments.ts            # CRUD de comentários
│       ├── users.ts               # Gestão de usuários (admin)
│       └── meta.ts                # Categorias, prioridades, stats
│
├── src/                           # Frontend (React 19 + TypeScript + Tailwind)
│   ├── index.tsx                  # Entry point, monta AuthProvider + App
│   ├── App.tsx                    # App principal com estado global e modais
│   ├── api.ts                     # Camada de fetch para todas as rotas da API
│   ├── auth.tsx                   # Context de autenticação (login/logout/roles)
│   ├── types.ts                   # Interfaces TypeScript (Task, Category, etc.)
│   ├── styles.css                 # Estilos Tailwind
│   ├── components/
│   │   ├── KanbanBoard.tsx        # Board com 3 colunas (todo/in_progress/done)
│   │   ├── TaskCard.tsx           # Card individual com drag, ações e badges
│   │   ├── TaskFormModal.tsx      # Modal de criação/edição de tarefa
│   │   ├── TaskDetailModal.tsx    # Modal de detalhes + comentários
│   │   ├── AdminDashboard.tsx     # Dashboard admin: listagem e criação de usuários
│   │   ├── ConfirmDialog.tsx      # Dialog de confirmação de exclusão
│   │   ├── Header.tsx             # Header com stats, user info e ações
│   │   ├── Login.tsx              # Tela de login
│   │   ├── ErrorToast.tsx         # Toast de erro com auto-dismiss
│   │   └── AriaLiveRegion.tsx     # Live region para anúncios a11y
│   ├── hooks/
│   │   ├── useDragAndDrop.ts      # Drag & drop com mouse (optimistic update)
│   │   ├── useKeyboardDrag.ts     # Drag via teclado (setas + Enter)
│   │   └── useTouchDrag.ts        # Drag via touch (long press)
│   └── utils/
│       └── helpers.ts             # Funções utilitárias (formatDate)
│
├── public/                        # Assets estáticos (build output)
│   ├── index.html                 # HTML principal
│   └── assets/                    # JS e CSS compilados
│
├── config.ts                      # Configuração (API_KEY via env var)
├── build.ts                       # Script de build (Bun bundler + PostCSS)
├── package.json                   # Deps e scripts (dev, build, test, format)
├── tsconfig.json                  # TypeScript strict, ESNext, bundler resolution
├── postcss.config.js              # PostCSS + Tailwind
└── tasks.db                       # Banco SQLite (gerado em runtime)
```

---

## Pré-requisitos

- [Bun](https://bun.sh) v1.3 ou superior

---

## Instalação e Execução

```bash
# 1. Instalar dependências
bun install

# 2. Compilar o frontend (JS + CSS)
bun run build.ts

# 3. Iniciar o servidor
bun run server/index.ts
```

A aplicação estará disponível em **http://localhost:3000**.

---

## Testes

```bash
# Executar todos os testes
bun test
```

O projeto utiliza o test runner nativo do Bun com `fast-check` para testes baseados em propriedade e `@testing-library/react` para testes de componentes.

---

## API REST

| Método | Endpoint                     | Descrição                            |
| ------ | ---------------------------- | ------------------------------------ |
| POST   | `/api/auth/login`            | Autenticação (login)                 |
| GET    | `/api/tasks`                 | Listar todas as tarefas              |
| GET    | `/api/tasks/:id`             | Obter tarefa por ID                  |
| POST   | `/api/tasks`                 | Criar nova tarefa                    |
| PUT    | `/api/tasks/:id`             | Atualizar tarefa                     |
| PATCH  | `/api/tasks/:id/status`      | Alterar status da tarefa             |
| DELETE | `/api/tasks/:id`             | Excluir tarefa                       |
| GET    | `/api/comments/task/:taskId` | Listar comentários de uma tarefa     |
| POST   | `/api/comments`              | Adicionar comentário                 |
| DELETE | `/api/comments/:id`          | Excluir comentário                   |
| GET    | `/api/categories`            | Listar categorias                    |
| GET    | `/api/priorities`            | Listar prioridades                   |
| GET    | `/api/stats`                 | Estatísticas (contadores por status) |
| GET    | `/api/users`                 | Listar usuários (admin)              |
| GET    | `/api/users/:id`             | Obter usuário por ID (admin)         |
| POST   | `/api/users`                 | Criar novo usuário (admin)           |
| PUT    | `/api/users/:id`             | Atualizar usuário (admin)            |
| DELETE | `/api/users/:id`             | Excluir usuário (admin)              |

---

## Banco de Dados

O SQLite é criado automaticamente na primeira execução (`tasks.db`) com as tabelas:

- **users** — usuários com username, email, senha (hash) e role (admin/editor/viewer)
- **tasks** — tarefas com título, descrição, status, prioridade, categoria e datas
- **categories** — categorias (Desenvolvimento, Design, Marketing, Infraestrutura, Pesquisa)
- **priorities** — níveis de prioridade (Baixa, Média, Alta, Urgente)
- **comments** — notas/comentários vinculados às tarefas

Dados de exemplo são inseridos automaticamente no primeiro uso.

---

## Licença

MIT
