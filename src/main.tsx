import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'mafs/core.css'
import 'katex/dist/katex.min.css'
import '@/utils/authBenchmark'
import { initGlobalErrorInterceptor } from '@/utils/globalErrorInterceptor'

initGlobalErrorInterceptor()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
