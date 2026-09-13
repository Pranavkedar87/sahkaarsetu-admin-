import React, { useState, useEffect } from 'react';
import { AdminTab, User, SystemHealthData } from './types';
import { getStoredUser, fetchCurrentUser } from './services/api/auth';
import { fetchSystemHealth } from './services/api/health';
import { getNotifications } from './services/api/notifications';

import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { SearchModal } from './components/common/SearchModal';
import { SplashScreen } from './components/common/SplashScreen';

import { DashboardPage } from './pages/DashboardPage';
import { KiosksPage } from './pages/KiosksPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { GrievancesPage } from './pages/GrievancesPage';
import { InsightsPage } from './pages/InsightsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(getStoredUser());
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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

  // Verify backend session or sync demo admin context on load
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) {
        setCurrentUser(u);
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

  // Handle Hamburger toggle intelligently for mobile vs desktop
  const handleToggleNavigation = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileNavOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="app-container">
      {/* ── Startup Splash Screen (visually matching Citizen portal) ── */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} minDurationMs={1200} />
      )}

      {/* ── Sidebar Navigation (Responsive Desktop + Mobile Drawer) ── */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        role="ADMIN"
        unreadNotificationsCount={unreadCount}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* ── Main Workspace Area ───────────────────────────────────── */}
      <div className="main-content">
        {/* Header Navbar */}
        <Navbar
          user={currentUser}
          systemHealth={systemHealth}
          unreadCount={unreadCount}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigate={(tab) => setActiveTab(tab)}
          onToggleSidebar={handleToggleNavigation}
        />

        {/* Page Content Body */}
        <main className="page-body">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => setActiveTab(tab)}
              role="ADMIN"
              systemHealth={systemHealth}
            />
          )}

          {activeTab === 'kiosks' && (
            <KiosksPage role="ADMIN" />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgePage role="ADMIN" />
          )}

          {activeTab === 'grievances' && (
            <GrievancesPage role="ADMIN" />
          )}

          {activeTab === 'insights' && (
            <InsightsPage
              onNavigate={(tab) => setActiveTab(tab)}
              role="ADMIN"
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage
              onNavigate={(tab) => setActiveTab(tab)}
              role="ADMIN"
              onRefreshBadge={refreshNotifications}
            />
          )}

          {activeTab === 'audit-logs' && (
            <AuditLogsPage role="ADMIN" />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              user={currentUser}
            />
          )}
        </main>
      </div>

      {/* ── Global Search Modal ────────────────────────────────────── */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />
    </div>
  );
};

export default App;
