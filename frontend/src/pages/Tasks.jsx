import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDate, isOverdue, getInitials, getAvatarColor } from '../utils/helpers';
import {
  RiTaskLine, RiSearchLine, RiFilterLine, RiEditLine,
  RiDeleteBinLine, RiCalendarLine, RiUserLine,
} from 'react-icons/ri';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [editModal, setEditModal] = useState({ open: false, task: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const openEdit = (task) => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo?._id || '',
    });
    setEditModal({ open: true, task });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await tasksAPI.update(editModal.task._id, editForm);
      setTasks(tasks.map(t => t._id === editModal.task._id ? data.task : t));
      toast.success('Task updated');
      setEditModal({ open: false, task: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tasksAPI.delete(deleteDialog.id);
      setTasks(tasks.filter(t => t._id !== deleteDialog.id));
      toast.success('Task deleted');
      setDeleteDialog({ open: false, id: null });
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const TaskCard = ({ task }) => {
    const overdue = isOverdue(task.dueDate, task.status);
    const canEdit = isAdmin || (task.assignedTo?._id === user._id);
    return (
      <div className="card p-4 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={`text-sm font-semibold flex-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.title}
          </p>
          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => openEdit(task)} className="p-1 rounded text-slate-400 hover:text-brand-600 transition-colors">
                <RiEditLine className="w-3.5 h-3.5" />
              </button>
              {isAdmin && (
                <button onClick={() => setDeleteDialog({ open: true, id: task._id })} className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors">
                  <RiDeleteBinLine className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {task.description && <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.project && <span className="badge bg-slate-100 text-slate-600">{task.project.name}</span>}
        </div>
        <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400">
          {task.assignedTo && (
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(task.assignedTo.name)}`}>
                {getInitials(task.assignedTo.name)}
              </div>
              <span>{task.assignedTo.name}</span>
            </div>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-0.5 ${overdue ? 'text-red-500 font-medium' : ''}`}>
              <RiCalendarLine className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const columnConfig = {
    todo: { label: 'Todo', color: 'bg-slate-400', count: grouped.todo.length },
    'in-progress': { label: 'In Progress', color: 'bg-blue-500', count: grouped['in-progress'].length },
    completed: { label: 'Completed', color: 'bg-emerald-500', count: grouped.completed.length },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Total <u>{tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}</u>
</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select className="input w-auto" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input w-auto" value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Spinner size="lg" /></div>
      ) : !tasks.length ? (
        <div className="card">
          <EmptyState icon={RiTaskLine} title="No tasks found" description="No tasks match your current filters." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Object.entries(grouped).map(([status, statusTasks]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${columnConfig[status].color}`} />
                <span className="text-sm font-bold text-slate-700">{columnConfig[status].label}</span>
                <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {statusTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {statusTasks.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-400">No tasks</p>
                  </div>
                ) : (
                  statusTasks.map(task => <TaskCard key={task._id} task={task} />)
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, task: null })} title="Edit Task">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
          </div>
          {isAdmin && (
            <>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={editForm.priority || 'medium'} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                    {['low', 'medium', 'high'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={editForm.dueDate || ''} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="label">Status</label>
            <select className="input" value={editForm.status || 'todo'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              {['todo', 'in-progress', 'completed'].map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setEditModal({ open: false, task: null })}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Update Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
      />
    </div>
  );
}
