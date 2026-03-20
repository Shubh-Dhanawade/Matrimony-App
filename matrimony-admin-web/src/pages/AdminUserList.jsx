import React, { useState, useEffect } from 'react';
import { Search, Loader, RefreshCw, Users as UsersIcon, Download, Mail, Phone, Calendar } from 'lucide-react';
import api from '../api';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      // Removed dummy data to see actual empty states or errors
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchUsers(); };

  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = 'ID,Name,Email,Mobile,Gender,Role,Created At\n';
    const rows = users.map(u => {
      const name = u.full_name || 'N/A';
      const date = u.created_at ? new Date(u.created_at).toLocaleDateString() : '';
      return `${u.id},"${name}",N/A,${u.mobile_number || ''},${u.gender || ''},${u.role || 'user'},${date}`;
    });
    const csv = headers + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `users-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    const fullName = (user.full_name || '').toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
      (user.mobile_number && user.mobile_number.includes(searchQuery));
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-active)', marginBottom: '0.5rem' }}>Total Users List</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View, search, and export the complete list of registered users on the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline hover-lift" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary hover-lift" onClick={handleExportCSV}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by name, email or mobile..."
              style={{ paddingLeft: '2.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="badge badge-approved" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            {filteredUsers.length} Users Found
          </span>
        </div>

        {loading && !refreshing ? (
          <div className="flex-center" style={{ height: '30vh' }}>
            <Loader className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <UsersIcon size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No members found matching your search.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', padding: '1.5rem', background: 'var(--background)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Contact Info</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const badgeClass = `badge ${user.role === 'admin' ? 'badge-pending' : 'badge-approved'}`;
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{user.id}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{user.full_name || 'Name not set'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.gender || 'Not specified'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <Phone size={14} color="var(--primary)" /> {user.mobile_number || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={badgeClass}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <Calendar size={14} color="var(--text-secondary)" />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserList;
