import {
  Plus,
  CheckCircle,
  Circle,
  Clock,
  ListChecks,
  Moon,
  Sun,
  User,
  SignOut,
  ShieldStar,
} from '@phosphor-icons/react';
import type { Stats } from '../types';

interface HeaderProps {
  stats: Stats;
  onNewTask: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  logout: () => void;
  isAdmin: boolean;
  onAdminDashboard: () => void;
}

export function Header({
  stats,
  onNewTask,
  darkMode,
  onToggleTheme,
  logout,
  isAdmin,
  onAdminDashboard,
}: HeaderProps) {
  const user = JSON.parse(localStorage.getItem('taskflow-user') || '{}');

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ListChecks size={20} weight="bold" className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              TaskFlow
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Circle
                size={16}
                weight="fill"
                className="text-slate-400 dark:text-slate-500"
              />
              <span>
                A Fazer:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {stats.todo}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock size={16} weight="fill" className="text-amber-500" />
              <span>
                Em Progresso:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {stats.in_progress}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle
                size={16}
                weight="fill"
                className="text-emerald-500"
              />
              <span>
                Concluídas:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {stats.done}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <User
                size={16}
                weight="bold"
                className="text-slate-600 dark:text-slate-300"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                {user.username || 'Visitante'}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-1 ${
                  user.role === 'admin'
                    ? 'bg-red-500 text-white'
                    : user.role === 'editor'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-500 text-white'
                }`}
              >
                {user.role?.toUpperCase() || 'VIS'}
              </span>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-150"
              title={darkMode ? 'Tema Claro' : 'Tema Escuro'}
            >
              {darkMode ? (
                <Sun size={20} weight="bold" />
              ) : (
                <Moon size={20} weight="bold" />
              )}
            </button>

            {isAdmin && (
              <button
                onClick={onAdminDashboard}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                title="Dashboard Admin"
                aria-label="Abrir dashboard de administração"
              >
                <ShieldStar size={20} weight="bold" />
              </button>
            )}

            <button
              onClick={logout}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
              title="Sair"
            >
              <SignOut size={20} weight="bold" />
            </button>

            <button
              onClick={onNewTask}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 flex items-center gap-2"
            >
              <Plus size={18} weight="bold" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
