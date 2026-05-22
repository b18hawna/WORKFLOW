import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  RiFolderLine,
  RiTaskLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowRightLine,
} from 'react-icons/ri';

import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { formatDate } from '../utils/helpers';
import Spinner from '../components/common/Spinner';

const StatCard = ({ icon: Icon, label, value, color, sublabel }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between mb-4">
      <div
        className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>

    <p className="text-3xl font-bold text-slate-900">{value}</p>

    <p className="text-sm font-medium text-slate-600 mt-0.5">
      {label}
    </p>

    {sublabel && (
      <p className="text-xs text-slate-400 mt-1">
        {sublabel}
      </p>
    )}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: res } = await tasksAPI.getStats();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  const {
    stats,
    recentTasks,
    tasksByStatus,
    tasksByPriority,
  } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Good morning, {user?.name?.split(' ')[0]}!
        </h2>

        <p className="text-slate-500 text-sm mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={RiFolderLine}
          label="Total Projects"
          value={stats?.totalProjects || 0}
          color="bg-brand-500"
        />

        <StatCard
          icon={RiTaskLine}
          label="Total Tasks"
          value={stats?.totalTasks || 0}
          color="bg-violet-500"
        />

        <StatCard
          icon={RiCheckboxCircleLine}
          label="Completed"
          value={stats?.completedTasks || 0}
          color="bg-emerald-500"
          sublabel={`${stats?.completionRate || 0}% rate`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tasks by status */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4">
            Tasks by Status
          </h3>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tasksByStatus || []}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {(tasksByStatus || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {(tasksByStatus || []).map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by priority */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-5">
            Tasks by Priority
          </h3>

          <div className="space-y-4">
            {(tasksByPriority || []).map((item) => {
              const maxValue = Math.max(
                ...(tasksByPriority || []).map((p) => p.value),
                1
              );

              const percentage = (item.value / maxValue) * 100;

              return (
                <div key={item.name}>

                  {/* Label + Value */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      {item.name}
                    </span>

                    <span className="text-sm text-slate-500">
                      {item.value}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Tasks */}
      <div className="card">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">
            Recent Tasks
          </h3>

          <Link
            to="/tasks"
            className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
          >
            View all
            <RiArrowRightLine className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">

          {!recentTasks?.length ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No tasks yet
            </div>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {task.title}
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {task.project?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />

                  <StatusBadge status={task.status} />

                  {task.dueDate && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                      <RiTimeLine className="w-3.5 h-3.5" />
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>

              </div>
            ))
          )}

        </div>
      </div>

    </div>
  );
}