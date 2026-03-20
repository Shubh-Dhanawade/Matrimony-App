import React, { useState, useEffect } from 'react';
import { Users, FileText, UserCheck, UserX, UserSearch, Crown, Loader, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error.response?.data || error.message);
      // Dummy data for visual presentation if API fails
      // Removed dummy data so accurate stats load or show empty.
      setStats({
        totalUsers: 0,
        totalProfiles: 0,
        pendingProfiles: 0,
        approvedProfiles: 0,
        rejectedProfiles: 0,
        totalPaidUsers: 0,
        totalUnpaidUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <Loader className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers || 0, color: "#3b82f6", icon: <Users size={24} /> },
    { title: "Total Profiles", value: stats?.totalProfiles || 0, color: "#8b5cf6", icon: <FileText size={24} /> },
    { title: "Pending Profiles", value: stats?.pendingProfiles || 0, color: "#f59e0b", icon: <UserSearch size={24} /> },
    { title: "Approved Profiles", value: stats?.approvedProfiles || 0, color: "#10b981", icon: <UserCheck size={24} /> },
    { title: "Rejected Profiles", value: stats?.rejectedProfiles || 0, color: "#ef4444", icon: <UserX size={24} /> },
    { title: "Paid Users", value: stats?.totalPaidUsers || 0, color: "#eab308", icon: <Crown size={24} /> },
    { title: "Unpaid Users", value: stats?.totalUnpaidUsers || 0, color: "#94a3b8", icon: <Users size={24} /> },
  ];

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-active)', marginBottom: '0.5rem' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to the Matrimony Admin Panel. Here are the latest statistics.</p>
        </div>
        <button onClick={fetchStats} className="btn btn-outline hover-lift"><TrendingUp size={18} /> Refresh Stats</button>
      </div>

      <div className="grid-cards glass" style={{ padding: '2rem', gap: '1.5rem', marginBottom: '3rem', borderLeft: '4px solid var(--primary)' }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="hover-lift" style={{ 
            background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', 
            borderLeft: `4px solid ${card.color}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: '1.5rem'
          }}>
            <div style={{ background: `${card.color}15`, color: card.color, padding: '1rem', borderRadius: '50%' }}>
              {card.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>{card.title}</p>
              <h2 style={{ color: 'var(--text-active)', fontSize: '1.75rem' }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-active)' }}>Quick Actions</h2>
      <div className="grid-cards">
        {[
          { title: 'Pending Profiles', sub: 'Review & Approve', to: '/pending-profiles', color: '#f59e0b', icon: <UserSearch size={28} /> },
          { title: 'Manage Users', sub: 'Deactivate or Reset Profiles', to: '/manage-users', color: '#ef4444', icon: <UserX size={28} /> },
          { title: 'Paid Memberships', sub: 'Toggle User Access', to: '/memberships', color: '#eab308', icon: <Crown size={28} /> },
          { title: 'Total Users List', sub: 'View All Registered Users', to: '/users', color: '#3b82f6', icon: <Users size={28} /> },
        ].map(action => (
          <Link to={action.to} key={action.title} className="hover-lift" style={{ 
            background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center',
            textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)'
          }}>
            <div style={{ background: `${action.color}15`, color: action.color, padding: '0.8rem', borderRadius: '10px' }}>
              {action.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{action.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{action.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
