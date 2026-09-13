import React from 'react';
import { Search, Bell, Menu, ShieldCheck, WifiOff } from 'lucide-react';
import { User, Role, AdminTab, SystemHealthData } from '../../types';
import { SahkaarSetuLogo } from './SahkaarSetuLogo';

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
    <header className="sahkaar-navbar">
      {/* ── Left Side: Hamburger & Mobile/Desktop Brand & Search ───────── */}
      <div className="navbar-left">
        {/* Hamburger Toggle */}
        <button
          onClick={onToggleSidebar}
          className="navbar-toggle-btn"
          aria-label="Toggle Navigation Menu"
          title="Toggle Navigation"
        >
          <Menu size={19} color="#0F6B68" />
        </button>

        {/* Mobile Brand */}
        <div
          className="navbar-mobile-brand"
          onClick={() => onNavigate('dashboard')}
          role="button"
          tabIndex={0}
          title="SahkaarSetu Operations Dashboard"
        >
          <SahkaarSetuLogo size={28} />
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">SahkaarSetu</span>
            <span className="navbar-brand-tag">Admin</span>
          </div>
        </div>

        {/* Desktop Quick Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="navbar-desktop-search"
          title="Quick search (⌘K or Ctrl+K)"
        >
          <Search size={16} />
          <span>Quick search (Kiosks, Docs, PACS)...</span>
          <kbd className="navbar-search-kbd">⌘K</kbd>
        </button>
      </div>

      {/* ── Right Side: Controls (Search icon, Health, Role, Bell, Profile) ── */}
      <div className="navbar-right">
        {/* Mobile-Only Search Icon Trigger */}
        <button
          onClick={onOpenSearch}
          className="navbar-icon-btn mobile-search-btn"
          aria-label="Open Search"
          title="Search"
        >
          <Search size={18} color="#334155" />
        </button>

        {/* Backend Connectivity Status (Desktop only) */}
        <div
          className="navbar-health-pill desktop-only-pill"
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
              <span>Local Demo</span>
            </>
          )}
        </div>

        {/* Administrator Badge (Desktop only) */}
        <div
          className="navbar-admin-badge desktop-only-pill"
          title="SahkaarSetu Operations Console — Administrator Mode"
        >
          <ShieldCheck size={14} style={{ color: 'var(--trust-600)' }} />
          <span>Administrator</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={() => onNavigate('notifications')}
          className="navbar-icon-btn"
          aria-label="Attention Center Notifications"
          title="Attention Center"
        >
          <Bell size={19} color="#1e293b" />
          {unreadCount > 0 && (
            <span className="navbar-bell-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar / Name */}
        <div
          onClick={() => onNavigate('profile')}
          className="navbar-profile-trigger"
          title={`Signed in as ${user.name} (${user.role})`}
          role="button"
          tabIndex={0}
        >
          <div className="navbar-avatar">
            {user.avatar || 'AD'}
          </div>
          <div className="navbar-user-meta desktop-only-meta">
            <span className="navbar-user-name">
              {user.name.split(' ')[0]}
            </span>
            <span className="navbar-user-role">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
