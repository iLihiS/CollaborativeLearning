import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'

import App from '@/App.tsx'
import theme from '@/theme/theme.ts'
import { FirestoreService } from '@/services/firestoreService'
import { FirestoreUserService } from '@/services/firestoreUserService'
import '@/index.css'


// Initialize Firestore services on app startup
async function initializeServices() {
  try {
    console.log('🔥 Initializing Firestore services...')
    await FirestoreService.initializeConnection()
    await FirestoreUserService.initializeUsers()
    console.log('✅ Firestore services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Firestore services:', error)
    throw error
  }
}

// Create RTL cache for Material-UI components
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
  prepend: true,
})

// Initialize services and render app
initializeServices()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
) 