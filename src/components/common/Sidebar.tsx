import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Monitor,
  BookOpen,
  AlertCircle,
  BarChart3,
  Bell,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AdminTab, Role } from '../../types';
import { SahkaarSetuLogo } from './SahkaarSetuLogo';

interface SidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  role?: Role;
  unreadNotificationsCount: number;
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadNotificationsCount,
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
}) => {
  // Listen for Escape key to dismiss mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { id: 'kiosks', label: 'Kiosk Management', icon: <Monitor size={19} /> },
    { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen size={19} /> },
    { id: 'grievances', label: 'Grievances', icon: <AlertCircle size={19} /> },
    { id: 'insights', label: 'Insights & Analytics', icon: <BarChart3 size={19} /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <ShieldCheck size={19} /> },
  ];

  const bottomItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={19} />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: 'profile', label: 'Admin Profile', icon: <UserCheck size={19} /> },
  ];

  const handleNavClick = (tab: AdminTab) => {
    onSelectTab(tab);
    // On mobile, close drawer upon navigation
    onCloseMobile();
  };

  return (
    <>
      {/* ── Mobile Backdrop Overlay ────────────────────────────────────── */}
      <div
        className={`sidebar-mobile-backdrop ${isMobileOpen ? 'open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* ── Main Sidebar / Drawer Container ────────────────────────────── */}
      <aside
        className={`admin-sidebar ${isOpen ? 'desktop-open' : 'desktop-collapsed'} ${
          isMobileOpen ? 'mobile-open' : 'mobile-closed'
        }`}
      >
        {/* ── Brand Header ────────────────────────────────────────────── */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-content">
            <SahkaarSetuLogo size={isOpen || isMobileOpen ? 34 : 32} />
            {(isOpen || isMobileOpen) && (
              <div className="sidebar-brand-titles">
                <h1 className="sidebar-brand-name">SAHKAARSETU</h1>
                <span className="sidebar-brand-subtitle">Operations Portal</span>
              </div>
            )}
          </div>

          {/* Mobile Close Button (X) */}
          <button
            onClick={onCloseMobile}
            className="sidebar-mobile-close-btn"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>

          {/* Desktop Collapse / Expand Arrow Button */}
          <button
            onClick={onToggle}
            className="sidebar-desktop-collapse-btn"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* ── Active Role Indicator Pill ──────────────────────────────── */}
        {(isOpen || isMobileOpen) && (
          <div className="sidebar-role-indicator">
            <span className="sidebar-role-label">Active Role:</span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
              Administrator
            </span>
          </div>
        )}

        {/* ── Navigation Items ───────────────────────────────────────── */}
        <nav className="sidebar-nav-container">
          <div className="sidebar-nav-group">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  title={!isOpen && !isMobileOpen ? item.label : undefined}
                >
                  <div className="sidebar-nav-icon">{item.icon}</div>
                  {(isOpen || isMobileOpen) && <span className="sidebar-nav-text">{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="sidebar-nav-divider" />

          <div className="sidebar-nav-group">
            {bottomItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  title={!isOpen && !isMobileOpen ? item.label : undefined}
                >
                  <div className="sidebar-nav-icon" style={{ position: 'relative' }}>
                    {item.icon}
                    {item.badge && !isOpen && !isMobileOpen && (
                      <span className="sidebar-collapsed-badge-dot" />
                    )}
                  </div>
                  {(isOpen || isMobileOpen) && <span className="sidebar-nav-text">{item.label}</span>}
                  {(isOpen || isMobileOpen) && item.badge && (
                    <span className="sidebar-nav-badge-pill">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Footer / Version Meta ──────────────────────────────────── */}
        <div className="sidebar-footer">
          {(isOpen || isMobileOpen) ? (
            <div className="sidebar-footer-content">
              <span className="sidebar-footer-title">Operations Console</span>
              <span className="sidebar-footer-version">v2.1</span>
            </div>
          ) : (
            <div className="sidebar-footer-collapsed-version">v2.1</div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
