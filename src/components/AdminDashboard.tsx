import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Trash,
  X,
  ArrowLeft,
  Eye,
  PencilSimple,
  ShieldStar,
  EnvelopeSimple,
  Lock,
  User,
  CaretDown,
} from '@phosphor-icons/react';
import { api } from '../api';

interface AppUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login: string | null;
}

interface AdminDashboardProps {
  onBack: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  editor:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  viewer:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'editor' | 'viewer';
}

const emptyForm: CreateUserForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'viewer',
};

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteUsername, setDeleteUsername] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteRequest = (user: AppUser) => {
    setDeleteConfirmId(user.id);
    setDeleteUsername(user.username);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await api.deleteUser(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteUsername('');
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Voltar ao Kanban"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                <ShieldStar size={20} weight="bold" className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Dashboard Admin
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerenciamento de usuários
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2"
            >
              <UserPlus size={18} weight="bold" />
              <span className="hidden sm:inline">Novo Usuário</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: 'Total',
              value: users.length,
              icon: (
                <Users size={20} weight="fill" className="text-indigo-500" />
              ),
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            },
            {
              label: 'Editors',
              value: users.filter((u) => u.role === 'editor').length,
              icon: (
                <PencilSimple
                  size={20}
                  weight="fill"
                  className="text-amber-500"
                />
              ),
              bg: 'bg-amber-50 dark:bg-amber-900/20',
            },
            {
              label: 'Viewers',
              value: users.filter((u) => u.role === 'viewer').length,
              icon: (
                <Eye size={20} weight="fill" className="text-emerald-500" />
              ),
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-xl p-4 flex items-center gap-3`}
            >
              {stat.icon}
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Fechar erro">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Users table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Users
              size={18}
              weight="bold"
              className="text-slate-500 dark:text-slate-400"
            />
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
              Usuários
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
              Carregando...
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">
                      Usuário
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">
                      Email
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300">
                      Role
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      Criado em
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                      Último login
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600 dark:text-slate-300 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-xs uppercase">
                              {user.username.slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${(ROLE_STYLES[user.role] ?? 'bg-slate-100 text-slate-600')}`}
                        >
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteRequest(user)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label={`Excluir ${user.username}`}
                            title="Excluir usuário"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3
              id="delete-dialog-title"
              className="text-lg font-semibold text-slate-900 dark:text-white mb-2"
            >
              Excluir usuário
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Tem certeza que deseja excluir{' '}
              <strong className="text-slate-900 dark:text-white">
                {deleteUsername}
              </strong>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteUsername('');
                }}
                className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create User Modal ──────────────────────────────────────────────────────────

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateUserForm, string>>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: Partial<Record<keyof CreateUserForm, string>> = {};
    if (!form.username || form.username.length < 3)
      next.username = 'Mínimo 3 caracteres';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'Email inválido';
    if (!form.password || form.password.length < 6)
      next.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword)
      next.confirmPassword = 'Senhas não coincidem';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await api.createUser({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      onSuccess();
    } catch (err: any) {
      setServerError(err.message || 'Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof CreateUserForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus
              size={20}
              weight="bold"
              className="text-indigo-600 dark:text-indigo-400"
            />
            <h2
              id="create-user-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              Novo Usuário
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {serverError}
              </div>
            )}

            {/* Username */}
            <div>
              <label
                htmlFor="new-username"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="new-username"
                  type="text"
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) => field('username', e.target.value)}
                  placeholder="ex: joao_silva"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.username
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="new-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <EnvelopeSimple
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="new-email"
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => field('email', e.target.value)}
                  placeholder="ex: joao@empresa.com"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.email
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => field('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.password
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="new-confirm-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="new-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => field('confirmPassword', e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="new-role"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Role
              </label>
              <div className="relative">
                <CaretDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  id="new-role"
                  value={form.role}
                  onChange={(e) =>
                    field('role', e.target.value as 'editor' | 'viewer')
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="viewer">Viewer — somente leitura</option>
                  <option value="editor">Editor — pode criar e editar</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Admins só podem ser criados diretamente no banco de dados.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus size={16} weight="bold" />
                  Criar Usuário
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
