import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, CreditCard, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';
import AdminDashboard from './pages/AdminDashboard';
import PendingProfiles from './pages/PendingProfiles';
import ManageUsers from './pages/ManageUsers';
import MembershipManagement from './pages/MembershipManagement';
import AdminUserList from './pages/AdminUserList';
import Login from './pages/Login';

// Layout component encapsulating sidebar and main content
const AdminLayout = ({ children, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Pending Profiles', path: '/pending-profiles', icon: <CheckCircle size={20} /> },
    { name: 'Manage Users', path: '/manage-users', icon: <ShieldAlert size={20} /> },
    { name: 'Memberships', path: '/memberships', icon: <CreditCard size={20} /> },
    { name: 'Total Users', path: '/users', icon: <Users size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: '#ffffff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={28} /> Admin Panel
          </h2>
        </div>
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', 
                  borderRadius: '8px', textDecoration: 'none',
                  background: isActive ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s'
                }}
              >
                {link.icon} {link.name}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--error)' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem("adminToken");
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex-center" style={{height: '100vh'}}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Admin Routes */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<AdminLayout setIsAuthenticated={setIsAuthenticated}><AdminDashboard /></AdminLayout>} />
            <Route path="/pending-profiles" element={<AdminLayout setIsAuthenticated={setIsAuthenticated}><PendingProfiles /></AdminLayout>} />
            <Route path="/manage-users" element={<AdminLayout setIsAuthenticated={setIsAuthenticated}><ManageUsers /></AdminLayout>} />
            <Route path="/memberships" element={<AdminLayout setIsAuthenticated={setIsAuthenticated}><MembershipManagement /></AdminLayout>} />
            <Route path="/users" element={<AdminLayout setIsAuthenticated={setIsAuthenticated}><AdminUserList /></AdminLayout>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
