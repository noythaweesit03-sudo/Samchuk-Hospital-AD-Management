/**
 * Samchuk Hospital AD Management (โรงพยาบาลสามชุก)
 * Active Directory Management Web Application - Phase 1 (Mock & Architecture)
 */

import React, { useState } from 'react';
import { CurrentUser, UserRole } from './types/ad';
import { LoginView } from './features/auth/LoginView';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DemoBanner } from './components/common/DemoBanner';
import { DashboardView } from './features/dashboard/DashboardView';
import { UsersView } from './features/users/UsersView';
import { ComputersView } from './features/computers/ComputersView';
import { OusView } from './features/ous/OusView';
import { GroupsView } from './features/groups/GroupsView';
import { AuditView } from './features/audit/AuditView';
import { SettingsView } from './features/settings/SettingsView';
import { ErrorScreens } from './features/errors/ErrorScreens';

export default function App() {
  // Current user state (defaults to SystemAdministrator for immediate evaluation)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>({
    id: 'mock-usr-admin',
    username: 'somchai.jai',
    displayName: 'นาย สมชาย ใจมั่นคง',
    role: 'SystemAdministrator',
    department: 'ศูนย์คอมพิวเตอร์และสารสนเทศ',
    sessionExpiry: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
  });

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [errorPreview, setErrorPreview] = useState<'403' | '404' | 'expired' | null>(null);

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setErrorPreview(null);
  };

  // Handle Role Switching
  const handleRoleChange = (newRole: UserRole) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      role: newRole,
    });

    // Check if new role has access to current page
    if ((newRole === 'Viewer' || newRole === 'Helpdesk') && (currentPage === 'audit' || currentPage === 'settings')) {
      setCurrentPage('dashboard');
    }
  };

  // Navigation with RBAC check
  const handleNavigate = (page: string) => {
    setErrorPreview(null);

    // RBAC validation
    if (currentUser?.role === 'Viewer' && (page === 'audit' || page === 'settings')) {
      setErrorPreview('403');
      return;
    }

    if (currentUser?.role === 'Helpdesk' && page === 'settings') {
      setErrorPreview('403');
      return;
    }

    setCurrentPage(page);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Conspicuous Demo / Mock Banner */}
      <DemoBanner />

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onTriggerErrorPreview={(type) => setErrorPreview(type)}
      />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentUser={currentUser}
        />

        {/* Right Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          {errorPreview ? (
            <ErrorScreens
              type={errorPreview}
              onDismiss={() => setErrorPreview(null)}
              onLoginAgain={() => {
                setErrorPreview(null);
                setCurrentUser(null);
              }}
            />
          ) : (
            <>
              {currentPage === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
              {currentPage === 'users' && <UsersView />}
              {currentPage === 'computers' && <ComputersView />}
              {currentPage === 'ous' && <OusView />}
              {currentPage === 'groups' && <GroupsView />}
              {currentPage === 'audit' && <AuditView />}
              {currentPage === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
