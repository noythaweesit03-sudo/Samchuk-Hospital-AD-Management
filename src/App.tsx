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

import {
  SessionAppState,
  createInitialSessionState,
  loginSession,
  logoutSession,
  expireSession,
  tickSession,
  resetActiveSessionTimer,
  simulateFiveSecondRemaining,
  navigateWithSessionGuard,
  switchRoleWithSessionGuard,
  triggerErrorPreviewWithSessionGuard,
  dismissErrorPreviewWithSessionGuard,
  canRenderProtectedView,
  isSessionExpiredState,
} from './utils/session';

export default function App() {
  // Centralized session & navigation state: starts with currentUser = null (Demo Login required)
  const [sessionState, setSessionState] = useState<SessionAppState>(createInitialSessionState);

  // Mobile Navigation Drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const { currentUser, currentPage, errorPreview, sessionRemainingSeconds } = sessionState;
  const sessionExpired = isSessionExpiredState(sessionState);

  // Session timer countdown effect
  useEffect(() => {
    if (!currentUser || sessionExpired) return;

    const timer = setInterval(() => {
      setSessionState((prev) => tickSession(prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser, sessionExpired]);

  // Keyboard accessibility: ESC key dismisses mobile drawer & non-expired error screens
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        setSessionState((prev) => dismissErrorPreviewWithSessionGuard(prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Reset session countdown ( strictly blocked if already expired )
  const handleResetSession = () => {
    setSessionState((prev) => resetActiveSessionTimer(prev));
  };

  // Immediate expiration for quick inspector testing
  const handleExpireSessionNow = () => {
    setIsMobileMenuOpen(false);
    setSessionState((prev) => expireSession(prev));
  };

  // 5-second quick test for inspector testing
  const handleSimulateExpireInFiveSeconds = () => {
    setSessionState((prev) => simulateFiveSecondRemaining(prev));
  };

  // Handle Login
  const handleLoginSuccess = (user: CurrentUser) => {
    setIsMobileMenuOpen(false);
    setSessionState(loginSession(user));
  };

  // Handle Logout
  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    setSessionState(logoutSession());
  };

  // Handle Role Switching (strictly blocked if session is expired)
  const handleRoleChange = (newRole: UserRole) => {
    setSessionState((prev) => switchRoleWithSessionGuard(prev, newRole));
  };

  // Navigation with centralized Session Lock & RBAC check
  const handleNavigate = (page: string) => {
    setIsMobileMenuOpen(false);
    setSessionState((prev) => navigateWithSessionGuard(prev, page));
  };

  // Trigger error preview screen with session lock protection
  const handleTriggerErrorPreview = (type: '403' | '404' | 'expired') => {
    setIsMobileMenuOpen(false);
    setSessionState((prev) => triggerErrorPreviewWithSessionGuard(prev, type));
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
        onTriggerErrorPreview={handleTriggerErrorPreview}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => {
          if (!sessionExpired) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }
        }}
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
          isMobileOpen={!sessionExpired && isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto" id="main-content" tabIndex={-1}>
          {sessionExpired ? (
            <ErrorScreens
              type="expired"
              onDismiss={() => {}}
              onLoginAgain={handleLogout}
            />
          ) : errorPreview ? (
            <ErrorScreens
              type={errorPreview}
              onDismiss={() => setSessionState((prev) => dismissErrorPreviewWithSessionGuard(prev))}
              onLoginAgain={handleLogout}
            />
          ) : canRenderProtectedView(sessionState) ? (
            <>
              {currentPage === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
              {currentPage === 'users' && <UsersView />}
              {currentPage === 'computers' && <ComputersView />}
              {currentPage === 'ous' && <OusView />}
              {currentPage === 'groups' && <GroupsView />}
              {currentPage === 'audit' && <AuditView />}
              {currentPage === 'settings' && <SettingsView />}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
