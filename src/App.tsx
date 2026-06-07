import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import type { Task, Category, Priority, Stats } from './types';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { useAuth } from './auth';

function ProtectedApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
  });
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('taskflow-dark-mode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    taskId: number | null;
  }>({ show: false, taskId: null });
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const { logout, isAdmin } = useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('taskflow-dark-mode', String(darkMode));
  }, [darkMode]);

  const toggleTheme = useCallback(() => setDarkMode((prev) => !prev), []);

  const loadData = useCallback(async () => {
    const [tasksData, categoriesData, prioritiesData, statsData] =
      await Promise.all([
        api.getTasks(),
        api.getCategories(),
        api.getPriorities(),
        api.getStats(),
      ]);
    setTasks(tasksData);
    setCategories(categoriesData);
    setPriorities(prioritiesData);
    setStats(statsData);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowFormModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowFormModal(true);
  };

  const handleTaskClick = (task: Task) => setSelectedTask(task);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    await api.updateStatus(taskId, newStatus);
    await loadData();
  };

  const handleTasksUpdate = useCallback((updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  }, []);

  const handleDeleteRequest = (taskId: number) => {
    setDeleteConfirm({ show: true, taskId });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.taskId) {
      await api.deleteTask(deleteConfirm.taskId);
      setDeleteConfirm({ show: false, taskId: null });
      setSelectedTask(null);
      await loadData();
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingTask) {
      await api.updateTask(editingTask.id, data);
    } else {
      await api.createTask(data);
    }
    setShowFormModal(false);
    setEditingTask(null);
    await loadData();
  };

  if (showAdminDashboard) {
    return <AdminDashboard onBack={() => setShowAdminDashboard(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header
        stats={stats}
        onNewTask={handleCreateTask}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        logout={logout}
        isAdmin={isAdmin}
        onAdminDashboard={() => setShowAdminDashboard(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteRequest}
          onStatusChange={handleStatusChange}
          isAdmin={isAdmin}
          onTasksUpdate={handleTasksUpdate}
        />
      </main>

      {showFormModal && (
        <TaskFormModal
          task={editingTask}
          categories={categories}
          priorities={priorities}
          isAdmin={isAdmin}
          onClose={() => {
            setShowFormModal(false);
            setEditingTask(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={() => {
            setSelectedTask(null);
            handleEditTask(selectedTask);
          }}
          onDelete={() => handleDeleteRequest(selectedTask.id)}
          onStatusChange={(status) => handleStatusChange(selectedTask.id, status)}
          onRefresh={loadData}
          isAdmin={isAdmin}
        />
      )}

      {deleteConfirm.show && (
        <ConfirmDialog
          title="Excluir Tarefa"
          message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, taskId: null })}
        />
      )}
    </div>
  );
}

function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <ProtectedApp />;
}

export default App;
