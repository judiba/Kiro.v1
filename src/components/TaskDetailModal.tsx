import { useState, useEffect } from 'react';
import {
  X,
  PencilSimple,
  Trash,
  CheckCircle,
  CalendarBlank,
  Tag,
  Flag,
  ChatDots,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import type { Task, Comment } from '../types';
import { api } from '../api';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Sem data definida';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const statusLabels: Record<string, string> = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  done: 'Concluída',
};

export function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onRefresh,
  isAdmin = false,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    const data = await api.getComments(task.id);
    setComments(data);
    setLoadingComments(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await api.addComment({ task_id: task.id, content: newComment.trim() });
    setNewComment('');
    await loadComments();
  };

  const handleMarkDone = () => {
    onStatusChange('done');
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-150';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: task.priority_color + '18',
                  color: task.priority_color,
                }}
              >
                <Flag size={12} weight="fill" className="mr-1" />
                {task.priority_name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {statusLabels[task.status]}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Tag
                size={16}
                weight="bold"
                style={{ color: task.category_color }}
              />
              <span>{task.category_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CalendarBlank
                size={16}
                weight="bold"
                className="text-slate-500 dark:text-slate-400"
              />
              <span>{formatDate(task.due_date)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            {task.status !== 'done' && (
              <button
                onClick={handleMarkDone}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm flex items-center gap-1.5"
              >
                <CheckCircle size={16} weight="bold" />
                Marcar como Concluída
              </button>
            )}
            <button
              onClick={onEdit}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm flex items-center gap-1.5"
            >
              <PencilSimple size={16} weight="bold" />
              Editar
            </button>
            {isAdmin && (
              <button
                onClick={onDelete}
                className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm flex items-center gap-1.5"
              >
                <Trash size={16} weight="bold" />
                Excluir
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <ChatDots
                size={18}
                weight="bold"
                className="text-slate-600 dark:text-slate-400"
              />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Notas e Comentários ({comments.length})
              </h3>
            </div>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
              <input
                type="text"
                className={`${inputClass} text-sm`}
                placeholder="Adicionar um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperPlaneTilt size={16} weight="fill" />
              </button>
            </form>

            {/* Comments list */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {loadingComments ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  Carregando...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                  Nenhum comentário ainda
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {comment.author}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
