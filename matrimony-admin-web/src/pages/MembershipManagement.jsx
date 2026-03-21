import React, { useState, useEffect } from 'react';
import { Search, Loader, RefreshCw, Crown, MonitorX, Phone } from 'lucide-react';
import api from '../api';

const MembershipManagement = () => {
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
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const [durations, setDurations] = useState({});

  const handleTogglePaid = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const days = durations[id] || 30;
      await api.patch(`/admin/users/${id}/paid`, { is_paid: newStatus, days });
      fetchUsers(); // Refresh to get dates
    } catch (error) {
      console.error(error);
      alert('Failed to update membership status');
    }
  };

  const handleDurationChange = (id, val) => {
    setDurations(prev => ({ ...prev, [id]: val }));
  };

  const handleRefresh = () => { setRefreshing(true); fetchUsers(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
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
          <h1 style={{ color: 'var(--text-active)', marginBottom: '0.5rem' }}>Membership Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Upgrade users to premium status or cancel their subscriptions.</p>
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
          <span className="badge badge-pending" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            {filteredUsers.length} Users
          </span>
        </div>

        {loading && !refreshing ? (
          <div className="flex-center" style={{ height: '30vh' }}>
            <Loader className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <MonitorX size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No members found matching your search.</p>
          </div>
        ) : (
          <div className="grid-cards" style={{ padding: '1.5rem', background: 'var(--background)' }}>
            {filteredUsers.map(user => {
              const badgeClass = `badge ${user.is_paid ? 'badge-approved' : 'badge-rejected'}`;
              const btnClass = `btn ${user.is_paid ? 'btn-error' : 'btn-success'}`;
              const avatarBg = user.is_paid ? '#fef3c7' : 'var(--primary)';
              const avatarColor = user.is_paid ? '#d97706' : 'white';
              return (
                <div key={user.id} className="hover-lift" style={{
                  background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px',
                  border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem'
                }}>
                  <div className="flex-between">
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{user.full_name || 'Name not set'}</h3>
                      <span className={badgeClass}>
                        {user.is_paid ? 'Premium' : (user.is_subscribed ? 'Upgrade Requested' : 'Free Member')}
                      </span>
                      {user.is_subscribed === 1 && !user.is_paid && (
                        <span className="badge badge-pending" style={{ marginLeft: '0.5rem', background: '#fef3c7', color: '#d97706' }}>Action Required</span>
                      )}
                    </div>
                    <div style={{ background: avatarBg, color: avatarColor, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {user.is_paid ? <Crown size={20} /> : (user.full_name?.[0] || 'U')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Phone size={16} color="var(--primary)" /> <span>{user.mobile_number || 'N/A'}</span>
                    </div>
                    {user.is_paid === 1 && user.premium_end_date && (
                        <div style={{ fontSize: '0.8rem', color: '#d97706', marginTop: '0.5rem', fontWeight: '500' }}>
                           Expires on: {formatDate(user.premium_end_date)}
                        </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
                    {!user.is_paid && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Duration:</span>
                            <select 
                                className="input-field" 
                                style={{ padding: '0.25rem', fontSize: '0.85rem' }}
                                value={durations[user.id] || 30}
                                onChange={(e) => handleDurationChange(user.id, e.target.value)}
                            >
                                <option value="7">7 Days</option>
                                <option value="30">30 Days</option>
                                <option value="90">90 Days</option>
                                <option value="180">180 Days</option>
                                <option value="365">365 Days</option>
                            </select>
                        </div>
                    )}
                    <button
                      onClick={() => handleTogglePaid(user.id, user.is_paid)}
                      className={btnClass}
                      style={{ flex: 1, padding: '0.6rem' }}
                    >
                      {user.is_paid
                        ? <><MonitorX size={18} /> Cancel Sub</>
                        : <><Crown size={18} /> Upgrade to Premium</>
                      }
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

export default MembershipManagement;
