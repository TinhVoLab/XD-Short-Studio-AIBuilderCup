import React, { Suspense, lazy } from 'react'
import styles from '@/App.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import TopBar from '@/components/TopBar/TopBar'
import Rail from '@/components/Rail/Rail'
import LeftPanel from '@/components/LeftPanel/LeftPanel'
import Canvas from '@/components/Canvas/Canvas'
import Inspector from '@/components/Inspector/Inspector'
import Filmstrip from '@/components/Filmstrip/Filmstrip'
import FloatingRenderWidget from '@/components/ExportModal/FloatingRenderWidget'
import { FloatingAiWizardWidget } from '@/components/AiWizardModal'

// ── On-Demand Lazy Loaded Modals (Zero Initial Bundle Impact) ──
const ExportModal = lazy(() => import('@/components/ExportModal/ExportModal'))
const AiWizardModal = lazy(() => import('@/components/AiWizardModal/AiWizardModal'))
const SettingsModal = lazy(() => import('@/components/SettingsModal/SettingsModal').then(m => ({ default: m.SettingsModal })))
const MascotStudioModal = lazy(() => import('@/components/MascotStudioModal/MascotStudioModal').then(m => ({ default: m.MascotStudioModal })))
const ProjectsModal = lazy(() => import('@/components/Projects/ProjectsModal'))
const AiDiagramModal = lazy(() => import('@/components/AiDiagramModal/AiDiagramModal').then(m => ({ default: m.AiDiagramModal })))

export const StudioWorkspace: React.FC = () => {
  const {
    workspaceLayout,
    aiWizardOpen,
    setAiWizardOpen,
    exportModalOpen,
    settingsModalOpen,
    mascotStudioOpen,
    projectsModalOpen,
    aiDiagramModalOpen,
  } = useEditorStore(
    useShallow(s => ({
      workspaceLayout: s.workspaceLayout,
      aiWizardOpen: s.aiWizardOpen,
      setAiWizardOpen: s.setAiWizardOpen,
      exportModalOpen: s.exportModalOpen,
      settingsModalOpen: s.settingsModalOpen,
      mascotStudioOpen: s.mascotStudioOpen,
      projectsModalOpen: s.projectsModalOpen,
      aiDiagramModalOpen: s.aiDiagramModalOpen,
    }))
  )

  return (
    <div className={styles.app}>
      <TopBar />
      <div className={styles.workspaceGrid} data-layout={workspaceLayout || 'classic'}>
        <Rail />
        <LeftPanel />
        <Canvas />
        <Inspector />
        <Filmstrip />
      </div>

      {/* Floating Background Status Widgets (Always Mounted) */}
      <FloatingRenderWidget />
      <FloatingAiWizardWidget />

      {/* On-Demand Modals Loaded via Code Splitting */}
      <Suspense fallback={null}>
        {exportModalOpen && <ExportModal />}
        {aiWizardOpen && <AiWizardModal open={aiWizardOpen} onClose={() => setAiWizardOpen(false)} />}
        {settingsModalOpen && <SettingsModal />}
        {mascotStudioOpen && <MascotStudioModal />}
        {projectsModalOpen && <ProjectsModal />}
        {aiDiagramModalOpen && <AiDiagramModal />}
      </Suspense>
    </div>
  )
}

export default StudioWorkspace
