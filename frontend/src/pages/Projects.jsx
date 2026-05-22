import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { formatDate, getInitials, getAvatarColor } from '../utils/helpers';
import {
  RiFolderLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCalendarLine, RiTeamLine, RiArrowRightLine,
} from 'react-icons/ri';

const statusOptions = ['active', 'on-hold', 'completed', 'cancelled'];

const ProjectForm = ({ form, setForm, users, loading, onSubmit, onClose, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Project Name *</label>
      <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="" required />
    </div>
    <div>
      <label className="label">Description</label>
      <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's this project about?" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Deadline</label>
        <input type="date" className="input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
      </div>
      {isEdit && (
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      )}
    </div>
<div>
  <label className="label">Team Members</label>

  <div className="space-y-2">
    {form.members.map((member, index) => (
      <div key={index} className="flex items-center gap-2">

        <select
          className="input flex-1"
          value={member}
          onChange={(e) => {
            const updatedMembers = [...form.members];
            updatedMembers[index] = e.target.value;

            setForm({
              ...form,
              members: updatedMembers,
            });
          }}
        >
          <option value="">Select Member</option>

          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>

        {/* Add Button */}
        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              members: [...form.members, ""],
            })
          }
          className="px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
        >
          +
        </button>

        {/* Remove Button */}
        {form.members.length > 1 && (
          <button
            type="button"
            onClick={() => {
              const updatedMembers = form.members.filter(
                (_, i) => i !== index
              );

              setForm({
                ...form,
                members: updatedMembers,
              });
            }}
            className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
          >
            -
          </button>
        )}
      </div>
    ))}
  </div>
</div>
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? <Spinner size="sm" /> : isEdit ? 'Update Project' : 'Create Project'}
      </button>
    </div>
  </form>
);

const emptyForm = { name: '', description: '', deadline: '', status: 'active', members: [''] };

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (isAdmin) {
      usersAPI.getAll().then(({ data }) => setUsers(data.users)).catch(() => {});
    }
  }, [isAdmin]);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModalOpen(true); };
  const openEdit = (project) => {
    setForm({
      name: project.name,
      description: project.description || '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      status: project.status,
      members: project.members.map(m => m._id),
    });
    setEditId(project._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name required');
    setSaving(true);
    try {
      if (editId) {
        const { data } = await projectsAPI.update(editId, form);
        setProjects(projects.map(p => p._id === editId ? data.project : p));
        toast.success('Project updated');
      } else {
        const { data } = await projectsAPI.create(form);
        setProjects([data.project, ...projects]);
        toast.success('Project created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectsAPI.delete(deleteDialog.id);
      setProjects(projects.filter(p => p._id !== deleteDialog.id));
      toast.success('Project deleted');
      setDeleteDialog({ open: false, id: null });
    } catch {
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<h2 className="text-xl font-bold text-slate-900">
  Total {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
</h2>  {/* <p className="text-sm text-slate-500">
    {projects.length} project{projects.length !== 1 ? 's' : ''}
  </p> */}
</div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>
            <RiAddLine className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {!projects.length ? (
        <div className="card">
          <EmptyState
            icon={RiFolderLine}
            title="No projects yet"
            description={isAdmin ? 'Create your first project to get started.' : 'You have not been added to any projects.'}
            action={isAdmin && <button className="btn-primary" onClick={openCreate}><RiAddLine className="w-4 h-4" />New Project</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                  <RiFolderLine className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={project.status} />
                  {isAdmin && (
                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <RiEditLine className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteDialog({ open: true, id: project._id })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <RiCalendarLine className="w-3.5 h-3.5" />
                    {formatDate(project.deadline)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <RiTeamLine className="w-3.5 h-3.5" />
                  {project.members?.length} member{project.members?.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Member avatars */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 4).map(m => (
                    <div key={m._id} title={m.name} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(m.name)}`}>
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {project.members?.length > 4 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>
              </div>

              <Link to={`/projects/${project._id}`} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                View Project <RiArrowRightLine className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Project' : 'New Project'} size="md">
        <ProjectForm form={form} setForm={setForm} users={users} loading={saving} onSubmit={handleSubmit} onClose={() => setModalOpen(false)} isEdit={!!editId} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Project"
        message="This will permanently delete the project and all its tasks. This action cannot be undone."
      />
    </div>
  );
}
