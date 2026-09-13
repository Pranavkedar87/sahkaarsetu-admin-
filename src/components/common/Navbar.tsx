import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { User, Role, AdminTab, SystemHealthData } from '../../types';
import { SahkaarSetuLogo } from './SahkaarSetuLogo';

interface NavbarProps {
  user: User;
  onRoleChange?: (newRole: Role) => void;
  systemHealth?: SystemHealthData;
  unreadCount: number;
  onOpenSearch: () => void;
  onNavigate: (tab: AdminTab) => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  unreadCount,
  onOpenSearch,
  onNavigate,
  onToggleSidebar,
}) => {
  return (
    <header className="sahkaar-navbar">
      {/* ── Left Side: Hamburger & Brand Lockup & Search Bar ───────── */}
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

        {/* SahkaarSetu Brand Lockup */}
        <div
          className="navbar-brand-lockup"
          onClick={() => onNavigate('dashboard')}
          role="button"
          tabIndex={0}
          title="SahkaarSetu Operations Dashboard"
        >
          <SahkaarSetuLogo size={32} />
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">SahkaarSetu</span>
            <span className="navbar-brand-tag">Admin</span>
          </div>
        </div>

        {/* Desktop & Tablet Search Field */}
        <button
          onClick={onOpenSearch}
          className="navbar-desktop-search"
          title="Quick search (⌘K or Ctrl+K)"
        >
          <Search size={16} />
          <span className="navbar-search-placeholder">Quick search (Kiosks, Docs, PACS)...</span>
          <kbd className="navbar-search-kbd">⌘K</kbd>
        </button>
      </div>

      {/* ── Right Side: Controls (Search icon, Bell, Profile) ──────── */}
      <div className="navbar-right">
        {/* Mobile / Narrow Search Trigger Icon */}
        <button
          onClick={onOpenSearch}
          className="navbar-icon-btn mobile-search-btn"
          aria-label="Open Search"
          title="Search"
        >
          <Search size={18} color="#334155" />
        </button>

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
