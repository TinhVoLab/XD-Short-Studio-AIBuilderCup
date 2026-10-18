import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { existsSync, rmSync } from 'fs'

function cleanDistStoragePlugin() {
  return {
    name: 'clean-dist-storage',
    closeBundle() {
      const distStorage = resolve(__dirname, 'dist/storage')
      const distUploads = resolve(__dirname, 'dist/uploads')
      if (existsSync(distStorage)) {
        rmSync(distStorage, { recursive: true, force: true })
        console.log('🧹 [Vite Build] Đã dọn sạch dist/storage (giữ dist siêu nhẹ & bảo mật)')
      }
      if (existsSync(distUploads)) {
        rmSync(distUploads, { recursive: true, force: true })
        console.log('🧹 [Vite Build] Đã dọn sạch dist/uploads (giữ dist siêu nhẹ & bảo mật)')
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), cleanDistStoragePlugin()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
      '/storage': 'http://localhost:4000',
      '/public': 'http://localhost:4000',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('fabric')) {
              return 'vendor-fabric'
            }
            if (id.includes('@remotion') || id.includes('/remotion/')) {
              return 'vendor-remotion'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
              return 'vendor-react'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('simplex-noise')) {
              return 'vendor-noise'
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase'
            }
            if (id.includes('katex')) {
              return 'vendor-katex'
            }
            if (id.includes('matter-js') || id.includes('mafs') || id.includes('smiles-drawer')) {
              return 'vendor-science'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
