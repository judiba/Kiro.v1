import type { Task, Category, Priority, Comment, Stats } from './types';

const BASE = '/api';
let globalToken: string | null = null;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (globalToken) {
    headers['Authorization'] = `Bearer ${globalToken}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
    // Clear token on auth errors
    globalToken = null;
    localStorage.removeItem('taskflow-token');
    localStorage.removeItem('taskflow-user');
    // Redirect to login would happen in app
    window.location.href = '/login';
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export class TimeoutError extends Error {
  constructor(message = 'A requisição excedeu o tempo limite.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function updateStatusWithTimeout(
  taskId: number,
  status: string,
  timeoutMs = 5000,
): Promise<Task> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (globalToken) {
    headers['Authorization'] = `Bearer ${globalToken}`;
  }

  try {
    const res = await fetch(`${BASE}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${res.status}: ${res.statusText}`,
      );
    }

    return res.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  setToken: (token: string | null) => {
    globalToken = token;
  },

  // Tasks
  getTasks: () => request<Task[]>('/tasks'),
  getTask: (id: number) => request<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: number, status: string) =>
    request<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id: number) =>
    request<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (taskId: number) =>
    request<Comment[]>(`/comments/task/${taskId}`),
  addComment: (data: { task_id: number; content: string; author?: string }) =>
    request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteComment: (id: number) =>
    request<{ success: boolean }>(`/comments/${id}`, { method: 'DELETE' }),

  // Meta
  getCategories: () => request<Category[]>('/categories'),
  getPriorities: () => request<Priority[]>('/priorities'),
  getStats: () => request<Stats>('/stats'),

  // Users (admin only)
  getUsers: () =>
    request<
      {
        id: number;
        username: string;
        email: string;
        role: string;
        created_at: string;
        last_login: string | null;
      }[]
    >('/users'),
  createUser: (data: {
    username: string;
    email: string;
    password: string;
    role: 'editor' | 'viewer';
  }) =>
    request<{ id: number; username: string; email: string; role: string }>(
      '/users',
      { method: 'POST', body: JSON.stringify(data) },
    ),
  updateUser: (
    id: number,
    data: Partial<{ username: string; email: string; role: string }>,
  ) =>
    request<{ id: number; username: string; email: string; role: string }>(
      `/users/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
    ),
  deleteUser: (id: number) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
};
