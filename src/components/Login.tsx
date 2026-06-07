import { useState } from 'react';
import { useAuth } from '../auth';
import { Eye, EyeSlash, Key } from '@phosphor-icons/react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error || 'Falha ao fazer login');
    }
    setLoading(false);
  };

  // Sample credentials for testing
  const sampleCredentials = [
    { role: 'admin', user: 'admin / admin123', perm: 'Acesso total' },
    { role: 'editor', user: 'editor / editor123', perm: 'Leitura/escrita' },
    { role: 'viewer', user: 'viewer / viewer123', perm: 'Somente leitura' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        {/* Left side - Branding */}
        <div className="w-full md:w-1/2 bg-indigo-600 p-8 text-white flex flex-col justify-center items-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
            <Key size={40} weight="bold" />
          </div>
          <h1 className="text-3xl font-bold mb-2">TaskFlow</h1>
          <p className="text-indigo-100 text-center max-w-xs">
            Sistema de gestão de tarefas com controle de acesso por papéis
          </p>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full md:w-1/2 p-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Entrar
            </h2>
          </div>

          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Faça login com suas credenciais para acessar o dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Usuário
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-150 pr-10"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye size={20} weight="bold" />
                  ) : (
                    <EyeSlash size={20} weight="bold" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-spin">Carregando...</span>
              ) : (
                <>
                  <Key size={20} weight="bold" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase">
              Credenciais de teste
            </p>
            <div className="space-y-2">
              {sampleCredentials.map((cred, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cred.role === 'admin'
                        ? 'bg-red-500'
                        : cred.role === 'editor'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                  <span>{cred.user}</span>
                  <span className="ml-auto text-slate-400">({cred.perm})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
