import React from 'react';
import { ShieldCheck, UserCheck, Key, Lock, Building, Mail, User, Info, CheckCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { User as UserType, Role } from '../types';

interface ProfilePageProps {
  user: UserType;
  onRoleChange: (newRole: Role) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onRoleChange, onLogout }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
          Operator Profile & Role Permissions
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
          Manage your operations role, assigned PACS society, and operational privileges.
        </p>
      </div>

      {/* User Card */}
      <Card
        title="Active Operator Profile"
        badge={
          <Badge variant={user.role === 'ADMIN' ? 'info' : 'success'}>
            {user.role === 'ADMIN' ? 'Administrator' : 'PACS Staff'}
          </Badge>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: user.role === 'ADMIN' ? 'var(--trust-700)' : 'var(--primary-700)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
            }}
          >
            {user.avatar || 'OP'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              {user.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>{user.email}</p>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              Operator ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{user.id}</span>
            </div>
          </div>
        </div>

        {user.assignedPacs && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: 'var(--primary-900)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <Building size={16} style={{ color: 'var(--primary-700)' }} />
            <span><strong>Assigned PACS Touchpoint:</strong> {user.assignedPacs}</span>
          </div>
        )}

        {/* Quick Role Toggle */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--slate-50)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.35rem' }}>
            Switch Active Role (Demo Mode)
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
            Toggle between Administrator and Staff to inspect role-tailored view boundaries and action restrictions:
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => onRoleChange('ADMIN')}
              className={`btn btn-sm ${user.role === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem' }}
            >
              <ShieldCheck size={14} /> Administrator Mode
            </button>
            <button
              onClick={() => onRoleChange('STAFF')}
              className={`btn btn-sm ${user.role === 'STAFF' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem' }}
            >
              <UserCheck size={14} /> PACS Staff Mode
            </button>
          </div>
        </div>
      </Card>

      {/* Permissions Matrix */}
      <Card
        title="Role Permissions Matrix"
        subtitle="Architectural capabilities granted to each operational tier"
      >
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Operational Capability</th>
                <th style={{ textAlign: 'center' }}>Staff Role</th>
                <th style={{ textAlign: 'center' }}>Administrator Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kiosk Fleet Monitoring & Telemetry</td>
                <td style={{ textAlign: 'center', color: 'var(--slate-500)' }}>Assigned PACS only</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success-700)' }}>Full Fleet (All Kiosks)</td>
              </tr>
              <tr>
                <td>Document Upload & Review</td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary-700)' }}>Draft & Upload</td>
                <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary-700)' }}>Draft & Upload</td>
              </tr>
              <tr>
                <td>Approve & Publish to AI Knowledge Base</td>
                <td style={{ textAlign: 'center', color: 'var(--danger-700)' }}>No (Review only)</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success-700)' }}>Full Authority</td>
              </tr>
              <tr>
                <td>Grievance Assignment & Resolution</td>
                <td style={{ textAlign: 'center', color: 'var(--slate-700)' }}>Assigned Cases</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success-700)' }}>All Grievances & Re-assign</td>
              </tr>
              <tr>
                <td>Operational Insights & Knowledge Gaps</td>
                <td style={{ textAlign: 'center', color: 'var(--slate-500)' }}>Summary metrics</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success-700)' }}>System-wide Analytics</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Backend Auth Architecture Notice (Requirement 4 & 18) */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.85rem',
            backgroundColor: 'var(--slate-50)',
            borderRadius: '6px',
            border: '1px dashed var(--border-color)',
            fontSize: '0.8rem',
            color: 'var(--slate-600)',
            lineHeight: 1.5,
          }}
        >
          ℹ️ <strong>Backend Authentication Requirement:</strong> The current FastAPI backend has not implemented <code>/api/auth/login</code> or JWT token issuance (PostgreSQL <code>users</code> table is a placeholder). The Admin portal structure is completely pre-wired to plug into backend auth tokens once that backend milestone is scheduled.
        </div>
      </Card>
    </div>
  );
};
