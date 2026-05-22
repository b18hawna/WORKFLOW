import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RiCheckboxCircleLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import Spinner from '../components/common/Spinner';
import loginImage from '../assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`absolute rounded-full border border-white`}
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <RiCheckboxCircleLine className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">WorkStack</h1>
          <p className="text-slate-400 text-lg max-w-sm">
            Organize work, manage teams, and ship projects on time.Making it easy for you all.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['Projects', 'Organize work'], ['Teams', 'Collaborate'], ['Analytics', 'Track progress']].map(([title, sub]) => (
              <div key={title} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <RiCheckboxCircleLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900"></span>
          </div>
          <img
            src={loginImage}
            alt="Login"
            className="w-40 mx-auto my-4 bg-black p-2 rounded-xl"
          />
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-1">
              Welcome back
            </h2>

            <p className="text-slate-500 mb-8">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="ABC@gmail.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 font-semibold hover:text-brand-700">
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
