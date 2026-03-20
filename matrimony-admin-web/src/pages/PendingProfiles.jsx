import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, RefreshCw, Loader, Phone, MapPin, UserSquare2 } from 'lucide-react';
import api from '../api';

const PendingProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingProfiles = async () => {
    try {
      const response = await api.get('/admin/profiles?status=Pending');
      setProfiles(response.data);
    } catch (error) {
      console.error(error);
      setProfiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingProfiles();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/profiles/${id}/status`, { status });
      // remove the acted upon profile from local UI
      setProfiles(profiles.filter(p => p.id !== id));
      alert(`Profile ${status}`);
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingProfiles();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <Loader className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-active)', marginBottom: '0.5rem' }}>Pending Profiles</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and approve user profiles awaiting verification.</p>
        </div>
        <button className="btn btn-outline hover-lift" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="Search profiles..." style={{ paddingLeft: '2.5rem' }} />
          </div>
          <span className="badge badge-pending" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            {profiles.length} profiles pending
          </span>
        </div>

        {profiles.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <UserSquare2 size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No pending profiles found.</p>
          </div>
        ) : (
          <div className="grid-cards" style={{ padding: '1.5rem', background: 'var(--background)' }}>
            {profiles.map(item => (
              <div key={item.id} className="hover-lift" style={{ 
                background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '1rem'
              }}>
                <div className="flex-between">
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{item.full_name}</h3>
                    <span className="badge badge-pending">{item.status}</span>
                  </div>
                  <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {item.full_name.charAt(0)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Phone size={16} color="var(--primary)" /> <span>{item.mobile_number}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <MapPin size={16} color="var(--primary)" /> <span>{item.birthplace}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <UserSquare2 size={16} color="var(--primary)" /> <span>{item.gender}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                  <button onClick={() => handleUpdateStatus(item.id, 'Approved')} className="btn btn-success" style={{ flex: 1, padding: '0.6rem' }}>
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button onClick={() => handleUpdateStatus(item.id, 'Rejected')} className="btn btn-error" style={{ flex: 1, padding: '0.6rem' }}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingProfiles;
