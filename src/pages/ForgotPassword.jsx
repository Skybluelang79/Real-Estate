import { useState } from 'react';
import { Link } from 'react-router';
import API_URL from '../config';
import usePageTitle from '../hooks/usePageTitle';

export default function ForgotPassword() {
  usePageTitle('Forgot Password');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetUrl: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section properties-page">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-card-icon">🔑</span>
            <h2>Reset Your Password</h2>
            <p>Enter your email and we'll send you a reset link</p>
          </div>

          {sent ? (
            <div className="auth-success">
              <p>{status || 'If an account exists for that email, a reset link has been sent. Check your inbox.'}</p>
              <Link to="/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>Back to Sign In</Link>
            </div>
          ) : (
            <>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label>Email</label>
                  <div className="auth-input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
                  </div>
                </div>
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="auth-switch">Remembered your password? <Link to="/signin">Sign in</Link></p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
