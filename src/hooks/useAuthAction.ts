import { useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

export interface UseAuthActionOptions {
  /**
   * Custom message to show in toast when action is blocked.
   * Defaults to: "Vui lòng đăng nhập tài khoản để thực hiện thao tác này."
   */
  message?: string;
  /**
   * Optional requirement: only allowed for administrator
   */
  requireAdmin?: boolean;
}

/**
 * Enterprise Action Guard Hook (Layer 2 Defense):
 * Wraps sensitive user interactions (Export, Render, Save, AI generation).
 * - If guest: intercepts instantly in 0ms, displays user toast, opens AuthModal.
 * - Zero HTTP requests, zero Cloud Function invocations, zero Firestore reads.
 * - If authenticated: seamlessly runs the action and returns its result.
 */
export function useAuthAction<T extends (...args: any[]) => any>(
  action: T,
  options?: UseAuthActionOptions
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
  const firebaseUser = useEditorStore((s) => s.firebaseUser);
  const currentUser = useEditorStore((s) => s.currentUser);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const showToast = useEditorStore((s) => s.showToast);

  return useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      // 1. Guard against guest / unauthenticated user
      if (!firebaseUser) {
        showToast(
          options?.message || 'Vui lòng đăng nhập tài khoản để thực hiện thao tác này.',
          3500
        );
        setAuthModalOpen(true);
        return undefined;
      }

      // 2. Guard against role-restricted actions
      if (options?.requireAdmin) {
        const isAdmin = currentUser.role === 'admin';
        if (!isAdmin) {
          showToast('Thao tác này chỉ dành cho Quản trị viên hệ thống.', 4000);
          return undefined;
        }
      }

      // 3. Execute business logic
      return action(...args);
    },
    [firebaseUser, currentUser, setAuthModalOpen, showToast, action, options?.message, options?.requireAdmin]
  );
}
