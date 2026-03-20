import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, AlertCircle, Loader } from 'lucide-react';
import api from '../api';

const Login = ({ setIsAuthenticated }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', {
        mobileNumber,
        password,
      });

      const { token, user } = response.data;
      
      if (user && user.role !== 'admin') {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return;
      }

      if (token) {
        localStorage.setItem('adminToken', token);
        if (user) {
          localStorage.setItem('adminUser', JSON.stringify(user));
        }
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError('Login failed. No token received.');
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div className="glass hover-lift" style={{ padding: '3rem', width: '100%', maxWidth: '440px', background: 'var(--surface)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Admin Portal</h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>Sign in to manage the Matrimony Platform</p>
        
        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter mobile number"
                style={{ paddingLeft: '2.5rem' }}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary shadow hover-lift" style={{ marginTop: '1rem', padding: '0.75rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? <Loader className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
