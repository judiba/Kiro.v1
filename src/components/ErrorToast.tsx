import { X } from '@phosphor-icons/react';

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl shadow-lg max-w-sm animate-in slide-in-from-bottom-2"
    >
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-300 transition-colors"
        aria-label="Dispensar mensagem de erro"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}
