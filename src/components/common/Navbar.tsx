import React from 'react';
import { Search, Bell, Menu, ShieldCheck, UserCheck, Activity, Wifi, WifiOff } from 'lucide-react';
import { User, Role, AdminTab, SystemHealthData } from '../../types';

interface NavbarProps {
  user: User;
  onRoleChange?: (newRole: Role) => void;
  systemHealth: SystemHealthData;
  unreadCount: number;
  onOpenSearch: () => void;
  onNavigate: (tab: AdminTab) => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  systemHealth,
  unreadCount,
  onOpenSearch,
  onNavigate,
  onToggleSidebar,
}) => {
  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Left side: Hamburger & Search trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.4rem', border: '1px solid var(--border-color)' }}
          title="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <button
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.9rem',
            fontSize: '0.85rem',
            color: 'var(--slate-500)',
            cursor: 'pointer',
            minWidth: '260px',
            textAlign: 'left',
          }}
        >
          <Search size={16} />
          <span>Quick search (Kiosks, Docs, PACS)...</span>
          <span
            style={{
              marginLeft: 'auto',
              backgroundColor: 'var(--slate-200)',
              fontSize: '0.7rem',
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Right side: Backend Health indicator, Role switcher, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Backend Connectivity Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: systemHealth.isBackendConnected ? 'var(--primary-50)' : 'var(--warning-50)',
            border: `1px solid ${systemHealth.isBackendConnected ? '#bbf7d0' : '#fde68a'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: systemHealth.isBackendConnected ? 'var(--primary-800)' : 'var(--warning-700)',
          }}
          title={
            systemHealth.isBackendConnected
              ? `FastAPI Backend Online (${systemHealth.service} - ${systemHealth.model})`
              : 'FastAPI Backend offline/standby. Operating on centralized local state.'
          }
        >
          {systemHealth.isBackendConnected ? (
            <>
              <span className="pulse-dot" />
              <span>FastAPI Live</span>
            </>
          ) : (
            <>
              <WifiOff size={13} style={{ color: 'var(--warning-600)' }} />
              <span>Local Demo Mode</span>
            </>
          )}
        </div>

        {/* Administrator Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'var(--trust-50)',
            border: '1px solid var(--trust-200)',
            borderRadius: '9999px',
            padding: '0.3rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--trust-800)',
          }}
          title="SahkaarSetu Operations Console — Administrator Mode"
        >
          <ShieldCheck size={14} style={{ color: 'var(--trust-600)' }} />
          <span>Administrator</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={() => onNavigate('notifications')}
          style={{
            position: 'relative',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '0.45rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--slate-600)',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Attention Center"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: 'var(--danger-600)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar & Name */}
        <div
          onClick={() => onNavigate('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            paddingLeft: '0.5rem',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: user.role === 'ADMIN' ? 'var(--trust-700)' : 'var(--primary-700)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {user.avatar || 'OP'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-800)', lineHeight: 1.2 }}>
              {user.name.split(' ')[0]}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
