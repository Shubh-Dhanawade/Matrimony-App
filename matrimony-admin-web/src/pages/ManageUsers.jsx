import React, { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Ban, RefreshCw, Loader, Phone, Mail, RotateCcw, Trash2, UserX } from 'lucide-react';
import api from '../api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Remove dummy users so it shows empty or loads the real data
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleActive = async (id, isActive) => {
    try {
      // If currently isActive, we want to BLOCK them (is_blocked = true)
      const shouldBlock = isActive; 
      await api.patch(`/admin/users/${id}/block`, { is_blocked: shouldBlock });
      setUsers(users.map(u => u.id === id ? { ...u, is_blocked: shouldBlock } : u));
    } catch (error) {
      console.error(error);
      alert('Failed to update user status');
    }
  };

  const handleResetProfile = async (id) => {
    if (!window.confirm('Are you sure you want to reset this profile? This will delete all profile data, photos, and connections.')) return;
    try {
      await api.delete(`/admin/users/${id}/reset-profile`);
      alert('Profile reset successfully');
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert('Failed to reset profile');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('PERMANENT ACTION: Delete this user and ALL their data?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      alert('User deleted permanently');
    } catch (error) {
      console.error(error);
      alert('Failed to delete user');
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchUsers(); };

  const filteredUsers = users.filter(user => {
    const fullName = (user.full_name || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
      (user.mobile_number && user.mobile_number.includes(searchQuery));
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-active)', marginBottom: '0.5rem' }}>Manage Users</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Activate or deactivate user accounts, reset passwords, or suspend users.</p>
        </div>
        <button className="btn btn-outline hover-lift" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name or mobile..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="badge badge-approved" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            {filteredUsers.length} Users
          </span>
        </div>

        {loading && !refreshing ? (
          <div className="flex-center" style={{ height: '30vh' }}>
            <Loader className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Ban size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No users found matching your search.</p>
          </div>
        ) : (
          <div className="grid-cards" style={{ padding: '1.5rem', background: 'var(--background)' }}>
            {filteredUsers.map(user => {
              // Map is_blocked to is_active concept for UI
              const isActive = (user.is_blocked === 0 || !user.is_blocked);
              const badgeClass = `badge ${isActive ? 'badge-approved' : 'badge-rejected'}`;
              const btnClass = `btn ${isActive ? 'btn-error' : 'btn-success'}`;
              return (
                <div key={user.id} className="hover-lift" style={{
                  background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px',
                  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                  <div className="flex-between">
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{user.full_name || 'Name not set'}</h3>
                      <span className={badgeClass}>
                        {isActive ? 'Active' : 'Blocked'}
                      </span>
                    </div>
                    <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {user.full_name?.[0] || 'U'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Phone size={16} color="var(--primary)" /> <span>{user.mobile_number || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleToggleActive(user.id, isActive)}
                      className={btnClass}
                      style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                    >
                      {isActive
                        ? <><UserX size={16} /> Block</>
                        : <><ToggleRight size={16} /> Unblock</>
                      }
                    </button>
                    <button
                      onClick={() => handleResetProfile(user.id)}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', color: '#f59e0b', borderColor: '#f59e0b' }}
                      title="Clear profile data but keep account"
                    >
                      <RotateCcw size={16} /> Reset
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn btn-error"
                      style={{ padding: '0.6rem', background: '#fee2e2', color: '#ef4444' }}
                      title="Delete account permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
