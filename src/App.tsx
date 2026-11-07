/**
 * Samchuk Hospital AD Management (โรงพยาบาลสามชุก)
 * Active Directory Management Web Application - Phase 1 Final Hardening & Verification
 * 
 * Strict Option A: Independent AD Management
 * 100% Mock Data & Mock Authentication - Zero Active Directory Live Connection
 */

import React, { useState, useEffect } from 'react';
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

import { hasPageAccess } from './utils/rbac';

const DEFAULT_SESSION_SECONDS = 900; // 15 minutes default mock session

export default function App() {
  // Current user state: starts as null to always present Demo Login first
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [errorPreview, setErrorPreview] = useState<'403' | '404' | 'expired' | null>(null);

  // Mobile Navigation Drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Simulated Session Expiration (Task 2: Testable without waiting hours)
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(DEFAULT_SESSION_SECONDS);

  // Session timer countdown effect
  useEffect(() => {
    if (!currentUser || errorPreview === 'expired') return;

    const timer = setInterval(() => {
      setSessionRemainingSeconds((prev) => {
        if (prev <= 1) {
          setErrorPreview('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, errorPreview]);

  // Keyboard accessibility: ESC key dismisses mobile drawer & error screens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        if (errorPreview && errorPreview !== 'expired') {
          setErrorPreview(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, errorPreview]);

  // Reset session countdown (e.g. user activity or manual extend)
  const handleResetSession = () => {
    setSessionRemainingSeconds(DEFAULT_SESSION_SECONDS);
  };

  // Immediate expiration for quick inspector testing
  const handleExpireSessionNow = () => {
    setSessionRemainingSeconds(0);
    setErrorPreview('expired');
  };

  // 5-second quick test for inspector testing
  const handleSimulateExpireInFiveSeconds = () => {
    setSessionRemainingSeconds(5);
  };

  // Handle Login
  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
    setErrorPreview(null);
    setSessionRemainingSeconds(DEFAULT_SESSION_SECONDS);
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setErrorPreview(null);
    setIsMobileMenuOpen(false);
    setSessionRemainingSeconds(DEFAULT_SESSION_SECONDS);
  };

  // Handle Role Switching
  const handleRoleChange = (newRole: UserRole) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      role: newRole,
    });

    // Check if new role has access to current page
    if (!hasPageAccess(newRole, currentPage)) {
      setErrorPreview('403');
    }
  };

  // Navigation with centralized RBAC check
  const handleNavigate = (page: string) => {
    setErrorPreview(null);
    setIsMobileMenuOpen(false);

    // Enforce Demo RBAC check
    if (!hasPageAccess(currentUser?.role, page)) {
      setErrorPreview('403');
      return;
    }

    setCurrentPage(page);
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
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
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        sessionRemainingSeconds={sessionRemainingSeconds}
        onResetSession={handleResetSession}
        onExpireSessionNow={handleExpireSessionNow}
        onSimulateExpireInFiveSeconds={handleSimulateExpireInFiveSeconds}
      />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop & Mobile Drawer) */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto" id="main-content" tabIndex={-1}>
          {errorPreview ? (
            <ErrorScreens
              type={errorPreview}
              onDismiss={() => setErrorPreview(null)}
              onLoginAgain={() => {
                setErrorPreview(null);
                setCurrentUser(null);
                setSessionRemainingSeconds(DEFAULT_SESSION_SECONDS);
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
