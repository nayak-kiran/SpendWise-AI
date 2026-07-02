import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#16213e',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <Link to="/dashboard" style={{ color: '#4ecca3', fontSize: '1.4rem', fontWeight: 'bold' }}>
        💰 SpendWise AI
      </Link>
      {token && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: '#e0e0e0' }}>Dashboard</Link>
          <Link to="/expenses" style={{ color: '#e0e0e0' }}>Expenses</Link>
          <Link to="/budget" style={{ color: '#e0e0e0' }}>Budget</Link>
          <button onClick={handleLogout} style={{
            backgroundColor: '#e94560',
            color: 'white',
            border: 'none',
            padding: '0.4rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
          }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
