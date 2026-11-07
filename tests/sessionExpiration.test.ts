/**
 * Samchuk Hospital AD Management - Session Expiration & Access Lock Unit Tests
 * Phase 1 Final Hardening & Verification
 *
 * Verifies real session lifecycle and expiration guard in src/utils/session.ts:
 * - Default session window (15 minutes / 900 seconds)
 * - Expiration threshold detection (< 60s warning state, <= 0s expired state)
 * - Strict lockout when expired: cannot navigate to Dashboard or any view,
 *   cannot dismiss expired screen, cannot extend/reset timer, cannot switch roles
 *   until performing a new Mock Login.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SESSION_SECONDS,
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
  isSessionInWarningState,
  isSessionExpiredState,
} from '../src/utils/session';
import { CurrentUser } from '../src/types/ad';

const MOCK_ADMIN_USER: CurrentUser = {
  id: 'usr-004',
  username: 'somchai.jai',
  displayName: 'นาย สมชาย ใจมั่นคง',
  role: 'SystemAdministrator',
  department: 'ศูนย์เทคโนโลยีสารสนเทศ (IT Department)',
  sessionExpiry: new Date(Date.now() + 900_000).toISOString(),
};

describe('Session Lifecycle & Strict Expiration Lockout Logic', () => {
  it('Default session window starts unauthenticated (null user) with 900 seconds (15 minutes)', () => {
    const initial = createInitialSessionState();
    assert.equal(initial.currentUser, null);
    assert.equal(initial.sessionRemainingSeconds, 900);
    assert.equal(DEFAULT_SESSION_SECONDS / 60, 15);
    assert.equal(canRenderProtectedView(initial), false);
  });

  it('Session warning threshold triggers when remaining time is under 60 seconds', () => {
    assert.equal(isSessionInWarningState(900), false, '900s should not trigger warning');
    assert.equal(isSessionInWarningState(60), false, '60s is exact boundary, not under 60s');
    assert.equal(isSessionInWarningState(59), true, '59s must trigger warning state');
    assert.equal(isSessionInWarningState(5), true, '5s must trigger warning state');
    assert.equal(isSessionInWarningState(0), false, '0s is expired, not warning');
  });

  it('Countdown tick transitions active session to strictly expired state when reaching 0 seconds', () => {
    let state = loginSession(MOCK_ADMIN_USER);
    assert.equal(canRenderProtectedView(state), true);

    state = simulateFiveSecondRemaining(state);
    assert.equal(state.sessionRemainingSeconds, 5);

    // Tick 4 times -> 1 second remaining, still active
    for (let i = 0; i < 4; i++) {
      state = tickSession(state);
    }
    assert.equal(state.sessionRemainingSeconds, 1);
    assert.equal(isSessionExpiredState(state), false);
    assert.equal(canRenderProtectedView(state), true);

    // Final tick -> 0 seconds remaining, transitions to expired lock
    state = tickSession(state);
    assert.equal(state.sessionRemainingSeconds, 0);
    assert.equal(state.isSessionExpired, true);
    assert.equal(state.errorPreview, 'expired');
    assert.equal(isSessionExpiredState(state), true);
    assert.equal(canRenderProtectedView(state), false);
  });

  it('Expired session strictly blocks navigation to Dashboard and all other views until Mock Login', () => {
    let state = loginSession(MOCK_ADMIN_USER);
    state = navigateWithSessionGuard(state, 'users');
    assert.equal(state.currentPage, 'users');
    assert.equal(canRenderProtectedView(state), true);

    // Expire session
    state = expireSession(state);
    assert.equal(state.isSessionExpired, true);
    assert.equal(state.errorPreview, 'expired');
    assert.equal(canRenderProtectedView(state), false);

    // Attempt to navigate back to Dashboard or Computers while expired
    const afterDashboardNav = navigateWithSessionGuard(state, 'dashboard');
    assert.equal(afterDashboardNav.isSessionExpired, true);
    assert.equal(afterDashboardNav.errorPreview, 'expired');
    assert.equal(canRenderProtectedView(afterDashboardNav), false, 'Must not render Dashboard when expired');

    const afterComputersNav = navigateWithSessionGuard(state, 'computers');
    assert.equal(afterComputersNav.isSessionExpired, true);
    assert.equal(afterComputersNav.errorPreview, 'expired');
    assert.equal(canRenderProtectedView(afterComputersNav), false, 'Must not render Computers when expired');
  });

  it('Expired session strictly blocks timer reset/extension, role switching, and error screen dismissal', () => {
    let state = loginSession(MOCK_ADMIN_USER);
    state = expireSession(state);

    // 1. Attempt to extend/reset timer while expired -> must remain expired at 0s
    const afterResetAttempt = resetActiveSessionTimer(state);
    assert.equal(afterResetAttempt.sessionRemainingSeconds, 0);
    assert.equal(afterResetAttempt.isSessionExpired, true);
    assert.equal(afterResetAttempt.errorPreview, 'expired');
    assert.equal(canRenderProtectedView(afterResetAttempt), false);

    // 2. Attempt to dismiss error screen while expired -> must remain on expired screen
    const afterDismissAttempt = dismissErrorPreviewWithSessionGuard(state);
    assert.equal(afterDismissAttempt.errorPreview, 'expired');
    assert.equal(afterDismissAttempt.isSessionExpired, true);
    assert.equal(canRenderProtectedView(afterDismissAttempt), false);

    // 3. Attempt to switch role while expired -> must remain locked
    const afterRoleSwitchAttempt = switchRoleWithSessionGuard(state, 'Viewer');
    assert.equal(afterRoleSwitchAttempt.errorPreview, 'expired');
    assert.equal(afterRoleSwitchAttempt.isSessionExpired, true);
    assert.equal(canRenderProtectedView(afterRoleSwitchAttempt), false);

    // 4. Attempt to switch error preview to 403/404 and then dismiss -> must remain expired
    const afterPreview403Attempt = triggerErrorPreviewWithSessionGuard(state, '403');
    assert.equal(afterPreview403Attempt.errorPreview, 'expired');
    const afterDismiss403Attempt = dismissErrorPreviewWithSessionGuard(afterPreview403Attempt);
    assert.equal(afterDismiss403Attempt.errorPreview, 'expired');
    assert.equal(canRenderProtectedView(afterDismiss403Attempt), false);
  });

  it('Active (non-expired) session allows timer reset to 900 seconds', () => {
    let state = loginSession(MOCK_ADMIN_USER);
    state = simulateFiveSecondRemaining(state);
    assert.equal(state.sessionRemainingSeconds, 5);

    state = resetActiveSessionTimer(state);
    assert.equal(state.sessionRemainingSeconds, 900);
    assert.equal(state.isSessionExpired, false);
    assert.equal(canRenderProtectedView(state), true);
  });

  it('Only Logout followed by a fresh Mock Login clears expiration lock and restores Dashboard access', () => {
    let state = loginSession(MOCK_ADMIN_USER);
    state = expireSession(state);
    assert.equal(canRenderProtectedView(state), false);

    // Step 1: Click "เข้าสู่ระบบใหม่ (Re-authenticate)" -> logs out to LoginView
    state = logoutSession();
    assert.equal(state.currentUser, null);
    assert.equal(canRenderProtectedView(state), false);

    // Step 2: Perform fresh Mock Login
    state = loginSession(MOCK_ADMIN_USER);
    assert.notEqual(state.currentUser, null);
    assert.equal(state.currentPage, 'dashboard');
    assert.equal(state.sessionRemainingSeconds, 900);
    assert.equal(state.isSessionExpired, false);
    assert.equal(state.errorPreview, null);
    assert.equal(canRenderProtectedView(state), true);
  });
});
