import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  AlertCircle,
  FileText,
  Bot,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { adminAPI } from '../services/api';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import '../styles/admin.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, empRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getEmployees()
      ]);
      setAnalytics(analyticsRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton height="60px" width="300px" />
        <div className="admin-kpi-grid" style={{ marginTop: '2rem' }}>
          <LoadingSkeleton height="110px" />
          <LoadingSkeleton height="110px" />
          <LoadingSkeleton height="110px" />
          <LoadingSkeleton height="110px" />
        </div>
        <LoadingSkeleton height="350px" />
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    totalEmployees: 128,
    activeOnboarding: 14,
    averageCompletion: 76,
    pendingTasks: 42
  };

  const categoryStats = analytics?.categoryStats || [];
  const weeklyActivity = analytics?.weeklyActivity || [];

  return (
    <div className="page-container">
      <div className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span className="badge badge-hr">PEOPLE & CULTURE MANAGEMENT</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          HR & Admin Analytics Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Track company-wide onboarding health, department activity, employee milestones, and AI retrieval utilization.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="admin-kpi-grid">
        <StatCard
          title="Total Employees"
          value={kpis.totalEmployees}
          icon={Users}
          color="var(--accent-primary)"
          subtitle="Enterprise workforce"
        />

        <StatCard
          title="Active Onboarding"
          value={kpis.activeOnboarding}
          icon={UserCheck}
          color="var(--accent-primary)"
          subtitle="Employees in progress"
        />

        <StatCard
          title="Average Completion"
          value={`${kpis.averageCompletion}%`}
          icon={TrendingUp}
          color="var(--success)"
          subtitle="Across all cohorts"
        />

        <StatCard
          title="Pending Tasks"
          value={kpis.pendingTasks}
          icon={AlertCircle}
          color="var(--warning)"
          subtitle="Awaiting sign-off"
        />
      </div>

      {/* Analytics Charts */}
      <div className="admin-charts-grid">
        {/* Weekly Completion & Queries Chart */}
        <div className="card">
          <div className="section-card-header">
            <h2 className="section-card-title">
              <BarChart3 size={18} color="var(--accent-primary)" />
              <span>Weekly Onboarding Throughput</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Completed Tasks vs AI Interactions
            </span>
          </div>

          <div style={{ height: 260, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    color: '#0F172A',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 12
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aiQueries" name="AI RAG Queries" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Completion Breakdown */}
        <div className="card">
          <div className="section-card-header">
            <h2 className="section-card-title">
              <PieIcon size={18} color="var(--accent-primary)" />
              <span>Milestone Categories</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Compliance %
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
            {categoryStats.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{cat.completed}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${cat.completed}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #0284C7 0%, #0D9488 100%)',
                      borderRadius: 999
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Roster Table */}
      <div className="admin-table-card">
        <div className="section-card-header">
          <h2 className="section-card-title">
            <Users size={18} color="var(--accent-primary)" />
            <span>Active Employee Roster</span>
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {employees.length} team members registered
          </span>
        </div>

        <table className="employee-roster-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department</th>
              <th>Experience</th>
              <th>Onboarding Progress</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                </td>
                <td>{emp.role}</td>
                <td>
                  <span className="badge badge-it">{emp.department}</span>
                </td>
                <td>{emp.experience || 'Fresher'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${emp.progressPercentage || 65}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {emp.progressPercentage || 65}%
                    </span>
                  </div>
                </td>
                <td>{new Date(emp.joiningDate || Date.now()).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
