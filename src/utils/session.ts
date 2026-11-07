/**
 * Samchuk Hospital AD Management - Session Lifecycle & Expiration Guard
 * Phase 1 Final Hardening & Verification
 *
 * Enforces strict session expiration behavior:
 * Once a session expires (timer reaches 0 or manual expiration), the user is strictly
 * locked out from accessing the Dashboard, previous views, or cached view states
 * until they perform a fresh Mock Login.
 */

import { CurrentUser, UserRole } from '../types/ad';
import { hasPageAccess } from './rbac';

export const DEFAULT_SESSION_SECONDS = 900; // 15 minutes default mock session
export const SESSION_WARNING_THRESHOLD_SECONDS = 60; // < 60 seconds warning state

export interface SessionAppState {
  currentUser: CurrentUser | null;
  currentPage: string;
  errorPreview: '403' | '404' | 'expired' | null;
  sessionRemainingSeconds: number;
  isSessionExpired: boolean;
}

export function createInitialSessionState(): SessionAppState {
  return {
    currentUser: null,
    currentPage: 'dashboard',
    errorPreview: null,
    sessionRemainingSeconds: DEFAULT_SESSION_SECONDS,
    isSessionExpired: false,
  };
}

export function isSessionInWarningState(remainingSeconds: number): boolean {
  return remainingSeconds > 0 && remainingSeconds < SESSION_WARNING_THRESHOLD_SECONDS;
}

export function isSessionExpiredState(state: Pick<SessionAppState, 'isSessionExpired' | 'sessionRemainingSeconds' | 'errorPreview'>): boolean {
  return (
    state.isSessionExpired ||
    state.sessionRemainingSeconds <= 0 ||
    state.errorPreview === 'expired'
  );
}

export function canRenderProtectedView(state: SessionAppState): boolean {
  if (!state.currentUser) return false;
  if (isSessionExpiredState(state)) return false;
  if (state.errorPreview !== null) return false;
  return true;
}

export function loginSession(user: CurrentUser): SessionAppState {
  return {
    currentUser: user,
    currentPage: 'dashboard',
    errorPreview: null,
    sessionRemainingSeconds: DEFAULT_SESSION_SECONDS,
    isSessionExpired: false,
  };
}

export function logoutSession(): SessionAppState {
  return createInitialSessionState();
}

export function expireSession(state: SessionAppState): SessionAppState {
  if (!state.currentUser) {
    return createInitialSessionState();
  }
  return {
    ...state,
    sessionRemainingSeconds: 0,
    isSessionExpired: true,
    errorPreview: 'expired',
  };
}

export function tickSession(state: SessionAppState): SessionAppState {
  if (!state.currentUser || isSessionExpiredState(state)) {
    return state.currentUser ? expireSession(state) : state;
  }

  if (state.sessionRemainingSeconds <= 1) {
    return expireSession(state);
  }

  return {
    ...state,
    sessionRemainingSeconds: state.sessionRemainingSeconds - 1,
  };
}

/**
 * Resets the session timer to 15 minutes ONLY if the session is still active.
 * Once expired, extending/resetting the session without re-login is strictly prohibited.
 */
export function resetActiveSessionTimer(state: SessionAppState): SessionAppState {
  if (!state.currentUser || isSessionExpiredState(state)) {
    return state.currentUser ? expireSession(state) : state;
  }

  return {
    ...state,
    sessionRemainingSeconds: DEFAULT_SESSION_SECONDS,
  };
}

/**
 * Sets remaining time to 5 seconds for rapid verification ONLY if the session is still active.
 */
export function simulateFiveSecondRemaining(state: SessionAppState): SessionAppState {
  if (!state.currentUser || isSessionExpiredState(state)) {
    return state.currentUser ? expireSession(state) : state;
  }

  return {
    ...state,
    sessionRemainingSeconds: 5,
  };
}

/**
 * Handles page navigation.
 * CRITICAL SECURITY GUARD: If the session is expired, navigation to Dashboard or any other page
 * is strictly blocked and the state remains locked on the 'expired' screen until Mock Login.
 */
export function navigateWithSessionGuard(state: SessionAppState, targetPage: string): SessionAppState {
  if (!state.currentUser) {
    return createInitialSessionState();
  }

  if (isSessionExpiredState(state)) {
    return expireSession(state);
  }

  if (!hasPageAccess(state.currentUser.role, targetPage)) {
    return {
      ...state,
      errorPreview: '403',
    };
  }

  return {
    ...state,
    currentPage: targetPage,
    errorPreview: null,
  };
}

/**
 * Handles role switching in Demo Mode.
 * Strictly blocked if the session is already expired.
 */
export function switchRoleWithSessionGuard(state: SessionAppState, newRole: UserRole): SessionAppState {
  if (!state.currentUser) {
    return createInitialSessionState();
  }

  if (isSessionExpiredState(state)) {
    return expireSession(state);
  }

  const nextUser: CurrentUser = {
    ...state.currentUser,
    role: newRole,
  };

  const hasAccess = hasPageAccess(newRole, state.currentPage);
  return {
    ...state,
    currentUser: nextUser,
    errorPreview: hasAccess ? null : '403',
  };
}

/**
 * Triggers error preview screens (403, 404, or expired).
 * If session is already expired, cannot downgrade errorPreview to 403/404 to bypass expiration.
 */
export function triggerErrorPreviewWithSessionGuard(
  state: SessionAppState,
  type: '403' | '404' | 'expired'
): SessionAppState {
  if (!state.currentUser) {
    return createInitialSessionState();
  }

  if (type === 'expired' || isSessionExpiredState(state)) {
    return expireSession(state);
  }

  return {
    ...state,
    errorPreview: type,
  };
}

/**
 * Dismisses 403/404 preview screens.
 * Strictly refuses to dismiss if session is expired.
 */
export function dismissErrorPreviewWithSessionGuard(state: SessionAppState): SessionAppState {
  if (!state.currentUser) {
    return createInitialSessionState();
  }

  if (isSessionExpiredState(state)) {
    return expireSession(state);
  }

  return {
    ...state,
    errorPreview: null,
  };
}
