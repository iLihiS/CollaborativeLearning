import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.tsx'
import '@/index.css'
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './theme/theme.ts';
import { FirestoreService } from '@/services/firestoreService';
import { FirestoreUserService } from '@/services/firestoreUserService';
import '@/utils/migrationHelper'; // Make migration helper available in console

// Initialize Firestore services
async function initializeServices() {
  try {
    console.log('🔥 Initializing Firestore services...');
    await FirestoreService.initializeData();
    await FirestoreUserService.initializeUsers();
    console.log('✅ Firestore services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firestore services:', error);
    throw error;
  }
}

initializeServices();

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
  prepend: true,
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </CacheProvider>
  </React.StrictMode>
) 