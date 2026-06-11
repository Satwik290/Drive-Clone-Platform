import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { HardDrive, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <HardDrive size={80} color="white" style={{marginBottom: '32px', zIndex: 10}} />
        <h1 className="brand-text">Drive Clone</h1>
        <p>A secure, scalable, and beautifully designed cloud storage platform for all your files.</p>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-card">
          <div>
            <h2 style={{fontFamily: 'Outfit', fontSize: '2rem', marginBottom: '8px'}}>Welcome back</h2>
            <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem'}}>Enter your credentials to access your account.</p>
          </div>
          
          {error && <div style={{ color: 'white', backgroundColor: 'var(--danger-color)', padding: '16px', borderRadius: 'var(--radius-md)', fontWeight: '500' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)'}}>Email Address</label>
              <input type="email" style={{width: '100%', padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', outline: 'none', fontSize: '1rem'}} placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-secondary)'}}>Password</label>
              <input type="password" style={{width: '100%', padding: '14px 20px', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', outline: 'none', fontSize: '1rem'}} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px', width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={20} /></>}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '700' }}>Create one for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
