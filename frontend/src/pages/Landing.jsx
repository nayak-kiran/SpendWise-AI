import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f3460',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '3rem', color: '#4ecca3', marginBottom: '1rem' }}>
        💰 SpendWise AI
      </h1>
      <p style={{ fontSize: '1.3rem', maxWidth: '600px', marginBottom: '0.5rem', color: '#e0e0e0' }}>
        Track Smarter. Spend Better.
      </p>
    
    
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/register">
          <button style={{
            backgroundColor: '#4ecca3',
            color: '#0f3460',
            border: 'none',
            padding: '0.8rem 2rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Get Started
          </button>
        </Link>
        <Link to="/login">
          <button style={{
            backgroundColor: 'transparent',
            color: '#4ecca3',
            border: '2px solid #4ecca3',
            padding: '0.8rem 2rem',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
          }}>
            Login
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Landing;
