import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { formatDate, getInitials, getAvatarColor, isOverdue } from '../utils/helpers';
import {
  RiArrowLeftLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCalendarLine, RiTeamLine, RiTaskLine, RiUserLine,
} from 'react-icons/ri';

const taskStatuses = ['todo', 'in-progress', 'completed'];
const taskPriorities = ['low', 'medium', 'high'];

const TaskForm = ({ form, setForm, members, loading, onSubmit, onClose, isEdit, isAdmin }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Title *</label>
      <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" required />
    </div>
    <div>
      <label className="label">Description</label>
      <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task description" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Priority</label>
        <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          {taskPriorities.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {taskStatuses.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
      </div>
      <div>
        <label className="label">Assign To</label>
        <select className="input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
      </div>
    </div>
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? <Spinner size="sm" /> : isEdit ? 'Update Task' : 'Create Task'}
      </button>
    </div>
  </form>
);

const emptyTaskForm = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', assignedTo: '' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, taskId: null });
  const [form, setForm] = useState(emptyTaskForm);
  const [editTaskId, setEditTaskId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await projectsAPI.getOne(id);
        setProject(data.project);
        setTasks(data.tasks);
      } catch {
        toast.error('Project not found');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetch();
    if (isAdmin) usersAPI.getAll().then(({ data }) => setAllUsers(data.users)).catch(() => {});
  }, [id, isAdmin, navigate]);

  const openCreateTask = () => { setForm(emptyTaskForm); setEditTaskId(null); setTaskModal(true); };
  const openEditTask = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo?._id || '',
    });
    setEditTaskId(task._id);
    setTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Task title required');
    setSaving(true);
    try {
      if (editTaskId) {
        const { data } = await tasksAPI.update(editTaskId, form);
        setTasks(tasks.map(t => t._id === editTaskId ? data.task : t));
        toast.success('Task updated');
      } else {
        const { data } = await tasksAPI.create({ ...form, project: id });
        setTasks([data.task, ...tasks]);
        toast.success('Task created');
      }
      setTaskModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await tasksAPI.delete(deleteDialog.taskId);
      setTasks(tasks.filter(t => t._id !== deleteDialog.taskId));
      toast.success('Task deleted');
      setDeleteDialog({ open: false, taskId: null });
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back to Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>
            {project.description && <p className="text-slate-500 text-sm mt-1">{project.description}</p>}
          </div>
          {isAdmin && (
            <button className="btn-primary flex-shrink-0" onClick={openCreateTask}>
              <RiAddLine className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: RiTaskLine, color: 'text-brand-600 bg-brand-50' },
          { label: 'Completed', value: completedCount, icon: RiTaskLine, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, icon: RiTaskLine, color: 'text-amber-600 bg-amber-50' },
          { label: 'Members', value: project.members?.length, icon: RiTeamLine, color: 'text-violet-600 bg-violet-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-brand-600">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{completedCount} of {tasks.length} tasks completed</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tasks list */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Tasks</h3>
            <span className="text-sm text-slate-400">{tasks.length} total</span>
          </div>
          {!tasks.length ? (
            <EmptyState
              icon={RiTaskLine}
              title="No tasks yet"
              description={isAdmin ? 'Add the first task to this project.' : 'No tasks assigned to this project.'}
              action={isAdmin && <button className="btn-primary" onClick={openCreateTask}><RiAddLine className="w-4 h-4" />Add Task</button>}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map(task => {
                const overdue = isOverdue(task.dueDate, task.status);
                const canEdit = isAdmin || (task.assignedTo?._id === user._id);
                return (
                  <div key={task._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                      <div className="flex items-center flex-wrap gap-2 mt-1.5">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            <RiCalendarLine className="w-3 h-3" />
                            {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <RiUserLine className="w-3 h-3" /> {task.assignedTo.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => openEditTask(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                          <RiEditLine className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteDialog({ open: true, taskId: task._id })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <RiDeleteBinLine className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members panel */}
        <div className="card h-fit">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Team Members</h3>
          </div>
          <div className="p-5 space-y-3">
            {project.members?.map(member => (
              <div key={member._id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(member.name)}`}>
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{member.name}</p>
                  <p className="text-xs text-slate-400 truncate capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title={editTaskId ? 'Edit Task' : 'New Task'}>
        <TaskForm
          form={form} setForm={setForm}
          members={project?.members || []}
          loading={saving} onSubmit={handleTaskSubmit}
          onClose={() => setTaskModal(false)}
          isEdit={!!editTaskId}
          isAdmin={isAdmin}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, taskId: null })}
        onConfirm={handleDeleteTask}
        loading={deleting}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
