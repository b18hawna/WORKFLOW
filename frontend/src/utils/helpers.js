import { format, isAfter, isBefore, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return 'No date';
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  return isBefore(typeof dueDate === 'string' ? parseISO(dueDate) : dueDate, new Date());
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getPriorityConfig = (priority) => {
  const configs = {
    high: { label: 'High', className: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    low: { label: 'Low', className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  };
  return configs[priority] || configs.medium;
};

export const getStatusConfig = (status) => {
  const configs = {
    todo: { label: 'Todo', className: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
    'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    active: { label: 'Active', className: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    'on-hold': { label: 'On Hold', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  };
  return configs[status] || { label: status, className: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
};

export const avatarColors = [
  'bg-violet-500', 'bg-blue-500', 'bg-cyan-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
];

export const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
};
