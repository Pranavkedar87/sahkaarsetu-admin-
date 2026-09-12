import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { DEMO_ADMIN_USER, login } from '../services/api/auth';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@sahkaarsetu.local');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoAccess = () => {
    onLoginSuccess(DEMO_ADMIN_USER);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            backgroundColor: 'var(--primary-800)',
            color: '#ffffff',
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              color: 'var(--primary-800)',
              fontWeight: 900,
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            स
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            SAHKAARSETU
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#bbf7d0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Operations & Administration Portal
          </p>
        </div>

        {/* Info Banner */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--trust-50)',
            borderBottom: '1px solid var(--trust-100)',
            fontSize: '0.75rem',
            color: 'var(--trust-800)',
            lineHeight: 1.4,
          }}
        >
          🔐 <strong>Admin Operations Console:</strong> Direct administrator access or authentication via <code>/api/admin/auth/login</code>.
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={handleDemoAccess}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                color: 'var(--trust-800)',
                backgroundColor: 'var(--trust-50)',
                border: '1px solid var(--trust-300)',
              }}
            >
              <ShieldCheck size={16} /> Enter Console as Administrator
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--critical-50)',
                  border: '1px solid var(--critical-100)',
                  color: 'var(--critical-700)',
                  fontSize: '0.78rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}
            >
              {loading ? 'Authenticating...' : 'Enter Operations Portal'} <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--slate-50)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--slate-500)',
          }}
        >
          SahkaarSetu Platform • SIH26088 Cooperative AI Operations
        </div>
      </div>
    </div>
  );
};
