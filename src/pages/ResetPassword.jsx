import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import API_URL from '../config';
import usePageTitle from '../hooks/usePageTitle';

export default function ResetPassword() {
  usePageTitle('Reset Password');
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setStatus(data.message || 'Password updated successfully.');
      setDone(true);
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section properties-page">
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-card-icon">ðŸ”</span>
            <h2>Set a New Password</h2>
            <p>Choose a strong password for your account</p>
          </div>

          {done ? (
            <div className="auth-success">
              <p>{status} Redirecting to sign in...</p>
              <Link to="/signin" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>Sign In Now</Link>
            </div>
          ) : (
            <>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label>New Password</label>
                  <div className="auth-input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : 'ðŸ‘ï¸'}</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="auth-input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" required />
                  </div>
                </div>
                {confirm && password !== confirm && <span className="form-error">Passwords do not match</span>}
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
