import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../components/common/Spinner';
import { getInitials, getAvatarColor } from '../utils/helpers';
import { RiUserLine, RiLockLine, RiShieldCheckLine } from 'react-icons/ri';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return toast.error('Name is required');
    setSavingName(true);
    try {
      const { data } = await usersAPI.updateProfile(nameForm);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill all fields');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setSavingPw(true);
    try {
      await usersAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Avatar card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${getAvatarColor(user?.name)}`}>
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <RiShieldCheckLine className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-semibold text-brand-600 capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Update name */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-5">
          <RiUserLine className="w-4 h-4 text-slate-500" /> Profile Information
        </h3>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })} placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input bg-slate-50" value={user?.email} disabled />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" className="btn-primary" disabled={savingName}>
            {savingName ? <Spinner size="sm" /> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-5">
          <RiLockLine className="w-4 h-4 text-slate-500" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Repeat new password" />
          </div>
          <button type="submit" className="btn-primary" disabled={savingPw}>
            {savingPw ? <Spinner size="sm" /> : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
