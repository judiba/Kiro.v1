export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority_id: number;
  category_id: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_color: string;
  priority_name: string;
  priority_level: number;
  priority_color: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Priority {
  id: number;
  name: string;
  level: number;
  color: string;
}

export interface Comment {
  id: number;
  task_id: number;
  content: string;
  author: string;
  created_at: string;
}

export interface Stats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export type TaskFormData = {
  title: string;
  description: string;
  priority_id: number;
  category_id: number;
  due_date: string;
};
