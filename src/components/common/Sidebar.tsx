import React from 'react';
import {
  LayoutDashboard,
  Monitor,
  BookOpen,
  AlertCircle,
  BarChart3,
  Bell,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { AdminTab, Role } from '../../types';

interface SidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  role?: Role;
  unreadNotificationsCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadNotificationsCount,
  isOpen,
  onToggle,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'kiosks', label: 'Kiosk Management', icon: <Monitor size={18} /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen size={18} /> },
    { id: 'grievances', label: 'Grievances', icon: <AlertCircle size={18} /> },
    { id: 'insights', label: 'Insights & Analytics', icon: <BarChart3 size={18} /> },
  ];

  const bottomItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: 'profile', label: 'Admin Profile', icon: <UserCheck size={18} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 40,
            display: 'none',
          }}
          className="mobile-sidebar-backdrop"
        />
      )}

      <aside
        style={{
          width: isOpen ? '260px' : '72px',
          transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          height: '100vh',
          userSelect: 'none',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: isOpen ? '1.25rem 1.25rem 1rem 1.25rem' : '1.25rem 0.5rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'space-between' : 'center',
          }}
        >
          {isOpen ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary-700)',
                    color: '#ffffff',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  स
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--primary-800)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    SAHKAARSETU
                  </h1>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      color: 'var(--trust-700)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Operations Portal
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '6px',
                backgroundColor: 'var(--primary-700)',
                color: '#ffffff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              स
            </div>
          )}

          <button
            onClick={onToggle}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Role Badge Indicator */}
        {isOpen && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--trust-50)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-600)', fontWeight: 600 }}>Active Role:</span>
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--trust-100)',
                color: 'var(--trust-800)',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              Administrator
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <div style={{ flex: 1, padding: '1rem 0.65rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: isOpen ? '0.65rem 0.85rem' : '0.65rem 0',
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                  color: isActive ? 'var(--primary-800)' : 'var(--slate-700)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.15s ease',
                }}
                title={!isOpen ? item.label : undefined}
              >
                <div style={{ color: isActive ? 'var(--primary-700)' : 'var(--slate-500)', display: 'flex' }}>
                  {item.icon}
                </div>
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.75rem 0.5rem' }} />

          {bottomItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: isOpen ? '0.65rem 0.85rem' : '0.65rem 0',
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--trust-50)' : 'transparent',
                  color: isActive ? 'var(--trust-800)' : 'var(--slate-700)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.15s ease',
                }}
                title={!isOpen ? item.label : undefined}
              >
                <div style={{ color: isActive ? 'var(--trust-700)' : 'var(--slate-500)', display: 'flex', position: 'relative' }}>
                  {item.icon}
                  {item.badge && !isOpen && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--danger-600)',
                      }}
                    />
                  )}
                </div>
                {isOpen && <span>{item.label}</span>}
                {isOpen && item.badge && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: 'var(--danger-100)',
                      color: 'var(--danger-700)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
          {isOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>Operations Console</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--trust-700)', fontWeight: 600 }}>v2.1</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--trust-700)', fontWeight: 700 }}>v2.1</div>
          )}
        </div>
      </aside>
    </>
  );
};
