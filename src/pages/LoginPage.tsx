import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Role, User } from '../types';
import { PRESET_DEV_CREDENTIALS, login } from '../services/api/auth';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [email, setEmail] = useState(PRESET_DEV_CREDENTIALS.ADMIN.email);
  const [password, setPassword] = useState(PRESET_DEV_CREDENTIALS.ADMIN.password);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setEmail(PRESET_DEV_CREDENTIALS[role].email);
    setPassword(PRESET_DEV_CREDENTIALS[role].password);
    setErrorMsg(null);
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
            backgroundColor: 'var(--primary-50)',
            borderBottom: '1px solid var(--primary-100)',
            fontSize: '0.75rem',
            color: 'var(--primary-800)',
            lineHeight: 1.4,
          }}
        >
          🔐 <strong>Admin Authentication:</strong> Connected to real backend <code>/api/admin/auth/login</code>. Select preset dev credentials or enter official credentials.
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Role Presets Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Select Operational Role
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleRoleSelect('ADMIN')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedRole === 'ADMIN' ? 'var(--trust-700)' : 'var(--border-color)'}`,
                  backgroundColor: selectedRole === 'ADMIN' ? 'var(--trust-50)' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.8rem', color: selectedRole === 'ADMIN' ? 'var(--trust-800)' : 'var(--slate-800)' }}>
                  <ShieldCheck size={14} /> Administrator
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                  Full kiosk & knowledge rights
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('STAFF')}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${selectedRole === 'STAFF' ? 'var(--primary-700)' : 'var(--border-color)'}`,
                  backgroundColor: selectedRole === 'STAFF' ? 'var(--primary-50)' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.8rem', color: selectedRole === 'STAFF' ? 'var(--primary-800)' : 'var(--slate-800)' }}>
                  <UserCheck size={14} /> PACS Staff
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                  Assigned cases & reviews
                </div>
              </button>
            </div>
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
