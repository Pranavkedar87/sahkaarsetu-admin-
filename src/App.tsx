import React, { useState, useEffect } from 'react';
import { AdminTab, Role, User, SystemHealthData } from './types';
import { getStoredUser, fetchCurrentUser, switchDevRole, logout } from './services/api/auth';
import { fetchSystemHealth } from './services/api/health';
import { getNotifications } from './services/api/notifications';

import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { SearchModal } from './components/common/SearchModal';

import { DashboardPage } from './pages/DashboardPage';
import { KiosksPage } from './pages/KiosksPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { GrievancesPage } from './pages/GrievancesPage';
import { InsightsPage } from './pages/InsightsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [systemHealth, setSystemHealth] = useState<SystemHealthData>({
    status: 'checking',
    service: 'FastAPI Operations Service',
    aiProvider: 'gemini',
    model: 'gemini-2.5-flash',
    embeddingModel: 'gemini-embedding-001',
    isBackendConnected: false,
    checkedAt: 'Polling...',
  });

  // Check auth session on load
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) {
        setCurrentUser(u);
      } else {
        setCurrentUser(null);
      }
    });
  }, []);

  // Global Health Polling
  const checkHealth = async () => {
    try {
      const res = await fetchSystemHealth();
      setSystemHealth(res.health);
    } catch {
      setSystemHealth((prev) => ({ ...prev, isBackendConnected: false }));
    }
  };

  // Notification count refresh
  const refreshNotifications = async () => {
    try {
      const res = await getNotifications();
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    checkHealth();
    refreshNotifications();
    const interval = setInterval(checkHealth, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut ⌘K or Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRoleChange = async (newRole: Role) => {
    const updated = await switchDevRole(newRole);
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  // If user is logged out, display clean login view
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        role={currentUser.role}
        unreadNotificationsCount={unreadCount}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <div className="main-content">
        {/* Header Navbar */}
        <Navbar
          user={currentUser}
          onRoleChange={handleRoleChange}
          systemHealth={systemHealth}
          unreadCount={unreadCount}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={(tab) => setActiveTab(tab)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content Body */}
        <main className="page-body">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => setActiveTab(tab)}
              role={currentUser.role}
              systemHealth={systemHealth}
            />
          )}

          {activeTab === 'kiosks' && (
            <KiosksPage role={currentUser.role} />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgePage role={currentUser.role} />
          )}

          {activeTab === 'grievances' && (
            <GrievancesPage role={currentUser.role} />
          )}

          {activeTab === 'insights' && (
            <InsightsPage
              onNavigate={(tab) => setActiveTab(tab)}
              role={currentUser.role}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage
              onNavigate={(tab) => setActiveTab(tab)}
              role={currentUser.role}
              onRefreshBadge={refreshNotifications}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              user={currentUser}
              onRoleChange={handleRoleChange}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};
