import React, { useEffect, useRef, Suspense } from 'react'
import styles from './App.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useAudioPlayback } from '@/hooks/useAudioPlayback'
import { usePlayerLoop } from '@/hooks/usePlayer'
import { useRenderJobListener } from '@/hooks/useRenderJobListener'
import { projectStorageService } from '@/services/projectStorageService'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthModal } from '@/components/Auth/AuthModal'
import { PricingModal } from '@/components/PricingModal/PricingModal'
import { redeemLicenseKey } from '@/config/payment'
import { registerUnauthorizedCallback } from '@/config/api'
import { useAuthAction } from '@/hooks/useAuthAction'

// Code-Splitting: Lazy load heavy components to make Landing Page ultra-fast
const LandingPage = React.lazy(() => import('@/components/LandingPage/LandingPage'))
const StudioWorkspace = React.lazy(() => import('@/components/StudioWorkspace'))
const AdminLoginGate = React.lazy(() => import('@/components/Admin/AdminLoginGate'))
const SuperAdminPortal = React.lazy(() => import('@/components/Admin/SuperAdminPortal'))

function Toast() {
  const { toastMsg, toastAction, clearToast } = useEditorStore()
  if (!toastMsg) return null
  return (
    <div className={styles.toast}>
      <svg width="13" height="13" viewBox="0 0 13 13" style={{ flexShrink: 0 }}>
        <circle cx="6.5" cy="6.5" r="5" stroke="var(--accent)" strokeWidth="1.3" fill="none" />
        <path d="M4 6.5L5.5 8L9 5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span>{toastMsg}</span>
      {toastAction && (
        <button
          className={styles.toastActionBtn}
          onClick={(e) => {
            e.stopPropagation()
            toastAction.onClick()
            clearToast()
          }}
        >
          {toastAction.label}
        </button>
      )}
    </div>
  )
}

function CyberLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: '#0A0A0B',
        color: '#BEFF01',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid rgba(190, 255, 1, 0.15)',
          borderTopColor: '#BEFF01',
          animation: 'spinLoader 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        Đang khởi chạy Studio Engine...
      </div>
    </div>
  )
}

export default function App() {
  useKeyboard()
  useAudioPlayback()
  usePlayerLoop()
  useRenderJobListener()
  const { 
    appViewMode, 
    setAppViewMode, 
    showToast,
    firebaseUser,
    currentUser,
    isAuthLoading,
    setAuthModalOpen,
    pricingModalOpen,
    setPricingModalOpen,
    switchPlanDev,
    fetchPlans,
  } = useEditorStore()

  // Fetch dynamic plans on mount (Single Source of Truth)
  useEffect(() => {
    fetchPlans().catch(() => {});
  }, [fetchPlans])

  // Initialize Route from URL pathname, query or hash (/admin vs ?view=app vs /)
  useEffect(() => {
    // If auth state is still resolving, wait
    if (isAuthLoading) return

    const params = new URLSearchParams(window.location.search)
    const viewParam = params.get('view')
    const pathname = window.location.pathname
    const hash = window.location.hash

    if (pathname === '/admin' || viewParam === 'admin' || hash === '#admin') {
      setAppViewMode('admin')
    } else if (viewParam === 'landing' || hash === '#landing') {
      setAppViewMode('landing')
    } else if (viewParam === 'app' || hash === '#app') {
      if (firebaseUser) {
        setAppViewMode('editor')
      } else {
        // Incognito / unauthenticated user tried to access Studio directly:
        // Redirect to landing and prompt to login
        setAppViewMode('landing')
        setAuthModalOpen(true)
        showToast('Vui lòng đăng nhập để truy cập Studio Workspace', 3500)
      }
    } else {
      // Root '/': If user is authenticated -> editor, otherwise -> landing
      setAppViewMode(firebaseUser ? 'editor' : 'landing')
    }

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search)
      const v = p.get('view')
      const path = window.location.pathname
      const h = window.location.hash
      const currentUser = useEditorStore.getState().firebaseUser

      if (path === '/admin' || v === 'admin' || h === '#admin') {
        setAppViewMode('admin')
      } else if (v === 'landing' || h === '#landing') {
        setAppViewMode('landing')
      } else if (v === 'app' || h === '#app') {
        if (currentUser) {
          setAppViewMode('editor')
        } else {
          setAppViewMode('landing')
          setAuthModalOpen(true)
        }
      } else {
        setAppViewMode(currentUser ? 'editor' : 'landing')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isAuthLoading, firebaseUser, setAppViewMode, setAuthModalOpen, showToast])

  // Auto-redirect to editor when user successfully authenticates from landing
  const prevUserRef = useRef<any>(null)
  useEffect(() => {
    if (!prevUserRef.current && firebaseUser && appViewMode === 'landing') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('view') !== 'landing' && window.location.hash !== '#landing') {
        navigateTo('editor')
      }
    }
    prevUserRef.current = firebaseUser
  }, [firebaseUser, appViewMode])

  // Handle URL change when user navigates
  const navigateTo = (mode: 'landing' | 'editor' | 'admin') => {
    // Auth Guard: Never allow unauthenticated navigation to editor
    if (mode === 'editor' && !useEditorStore.getState().firebaseUser) {
      setAppViewMode('landing')
      setAuthModalOpen(true)
      showToast('Vui lòng đăng nhập để truy cập Studio Workspace', 3500)
      return
    }

    setAppViewMode(mode)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('xd_short_view_mode', mode)
    }
    const url = new URL(window.location.href)
    if (mode === 'admin') {
      url.pathname = '/admin'
      url.searchParams.delete('view')
      url.hash = ''
    } else if (mode === 'editor') {
      if (url.pathname === '/admin') {
        url.pathname = '/'
      }
      url.searchParams.set('view', 'app')
      url.hash = ''
    } else {
      if (url.pathname === '/admin') {
        url.pathname = '/'
      }
      url.searchParams.delete('view')
      url.hash = ''
    }
    window.history.pushState({}, '', url.toString())
  }

  useEffect(() => {
    if (appViewMode === 'landing' || appViewMode === 'admin') {
      document.documentElement.style.overflow = 'auto'
      document.documentElement.style.height = 'auto'
      document.body.style.overflow = 'auto'
      document.body.style.height = 'auto'
      const rootEl = document.getElementById('root')
      if (rootEl) {
        rootEl.style.overflow = 'visible'
        rootEl.style.height = 'auto'
        rootEl.style.minHeight = '100vh'
      }
    } else {
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.height = '100%'
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100%'
      const rootEl = document.getElementById('root')
      if (rootEl) {
        rootEl.style.overflow = 'hidden'
        rootEl.style.height = '100%'
      }
    }
  }, [appViewMode])

  useEffect(() => {
    const initProject = async () => {
      const savedProjectId = localStorage.getItem('xd_short_active_project_id')
      if (savedProjectId) {
        try {
          await useEditorStore.getState().loadProjectById(savedProjectId)
        } catch {
          projectStorageService.loadFromLocalStorage()
        }
      } else {
        projectStorageService.loadFromLocalStorage()
      }
      useEditorStore.getState().refreshProjectsList()
    }

    initProject()

    // Apply saved brand color on startup
    const brandColor = useEditorStore.getState().brandingSettings?.brandColor || '#BEFF01'
    document.documentElement.style.setProperty('--accent', brandColor)
    document.documentElement.style.setProperty('--accent-dim', `${brandColor}18`)
    document.documentElement.style.setProperty('--accent-glow', `${brandColor}44`)

    // Auto-save on state changes
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      if (
        state.scenes !== prevState.scenes ||
        state.projectName !== prevState.projectName ||
        state.projectTitle !== prevState.projectTitle ||
        state.audioClips !== prevState.audioClips ||
        state.bgMusicUrl !== prevState.bgMusicUrl
      ) {
        projectStorageService.autoSaveToLocalStorage()
      }
    })

    // Initialize Firebase Auth listener
    const unsubscribeAuth = useEditorStore.getState().initAuthListener()

    // Register global 401 Unauthorized listener (Enterprise Inversion-of-Control)
    const unsubscribeUnauthorized = registerUnauthorizedCallback(() => {
      useEditorStore.getState().setAuthModalOpen(true)
      useEditorStore.getState().showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 4000)
    })

    return () => {
      unsubscribe()
      unsubscribeAuth()
      unsubscribeUnauthorized()
    }
  }, [])

  // Action Guards for Landing Page interactions
  const handleOpenStudio = useAuthAction(() => {
    navigateTo('editor')
  }, { message: 'Vui lòng đăng nhập để truy cập Studio Workspace' })

  const handleActivateLicenseAuth = useAuthAction(() => {
    navigateTo('editor')
  }, { message: 'Vui lòng đăng nhập tài khoản để kích hoạt và liên kết bản quyền.' })

  const isSuperAdmin = currentUser.role === 'admin'

  return (
    <ErrorBoundary>
      {appViewMode === 'admin' ? (
        <Suspense fallback={<CyberLoadingFallback />}>
          {isSuperAdmin ? (
            <SuperAdminPortal onBackToStudio={() => navigateTo('editor')} />
          ) : (
            <AdminLoginGate onBackToStudio={() => navigateTo('editor')} />
          )}
          <Toast />
        </Suspense>
      ) : isAuthLoading && (appViewMode === 'editor' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'app')) ? (
        <CyberLoadingFallback />
      ) : appViewMode === 'editor' && firebaseUser ? (
        <Suspense fallback={<CyberLoadingFallback />}>
          <StudioWorkspace />
          <Toast />
          <AuthModal />
          <PricingModal isOpen={pricingModalOpen} onClose={() => setPricingModalOpen(false)} />
        </Suspense>
      ) : (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#0A0A0B' }}>
          <Suspense fallback={<CyberLoadingFallback />}>
            <LandingPage
              onOpenStudio={handleOpenStudio}
              onActivateLicense={async (key) => {
                if (!firebaseUser) {
                  showToast('Vui lòng đăng nhập để liên kết bản quyền với tài khoản của bạn.', 3500)
                  setAuthModalOpen(true)
                  return
                }
                const res = await redeemLicenseKey(key)
                if (res.success && res.tier) {
                  switchPlanDev(res.tier)
                  showToast(`Chúc mừng! Gói ${res.tier.toUpperCase()} đã kích hoạt thành công.`, 3500)
                  handleActivateLicenseAuth()
                } else {
                  showToast(res.error || 'Mã kích hoạt không hợp lệ', 3500)
                }
              }}
            />
          </Suspense>
          <Toast />
          <AuthModal />
          <PricingModal isOpen={pricingModalOpen} onClose={() => setPricingModalOpen(false)} />
        </div>
      )}
    </ErrorBoundary>
  )
}
