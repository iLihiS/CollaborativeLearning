import { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { LoginForm } from "@/components/LoginForm";
import AccessibilityWidget from '@/components/AccessibilityWidget';
import { DebugPanel } from '@/components/DebugPanel';
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import '@/utils/debugUtils'; // Load debug tools
import { ToastState } from "@/types";
import { User as UserEntity } from "@/api/entities";

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

export const Layout = ({ children }: LayoutProps) => {
  const { session, user, loading, loginError, setLoginError, logout, loadUser } = useAuth();
  const { unreadNotifications, unhandledInquiries } = useNotifications(session?.user || user);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [toast, setToast] = useState<ToastState>({ open: false, message: '' });

  useEffect(() => {
    document.title = 'למידה שיתופית בקריה האקדמית אונו';
    document.documentElement.setAttribute('dir', 'rtl');
    
    const faviconUrl = 'https://yedion.ono.ac.il/info/images/Favicon.ico';
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, []);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await UserEntity.logout();
      setToast({ open: true, message: "התנתקת בהצלחה מהמערכת" });
    } catch (error) {
      console.error('Logout error:', error);
      setToast({ open: true, message: "התנתקות הושלמה, נתוני המערכת נוקו בהצלחה" });
    }
    sessionStorage.removeItem('session_theme');
    logout();
  };

  const handleLoginSuccess = async () => {
    try {
      await loadUser();
      setToast({ open: true, message: "התחברת בהצלחה למערכת" });
      setLoginError('');
    } catch (error) {
      console.error('Error loading user after login:', error);
    }
  };

  const handleLoginError = (error: string) => {
    setLoginError(error);
  };

  const handleCloseToast = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast({ ...toast, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-24 h-24 p-1 border-2 border-lime-200 dark:border-lime-700 rounded-full mx-auto mb-6 flex items-center justify-center bg-lime-500">
               <img src="/logo.svg" alt="לוגו למידה שיתופית" className="w-20 h-16" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">ברוכים הבאים ללמידה שיתופית</h1>
            <p className="text-lg font-medium text-lime-600 dark:text-lime-400 mt-1 mb-6">בקריה האקדמית אונו</p>
          </div>
          
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}
          
          <LoginForm 
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
          />
        </div>
        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 2 }}
        >
          <Alert 
            onClose={handleCloseToast} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </div>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        :root {
          --bg-primary: #f8fafc;
          --bg-card: #ffffff;
          --bg-sidebar: #ffffff;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-muted: #94a3b8;
          --border-color: #e2e8f0;
          --lime-primary: #84cc16;
          --lime-secondary: #65a30d;
        }

        .dark {
          --bg-primary: #0f172a;
          --bg-card: #1e293b;
          --bg-sidebar: #1e293b;
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --border-color: #334155;
          --lime-primary: #84cc16;
          --lime-secondary: #a3e635;
        }
      `}</style>
      
      <Header
        onMenuToggle={handleMenuToggle}
        unreadNotifications={unreadNotifications}
        unhandledInquiries={unhandledInquiries}
      />
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar
          user={session?.user || user}
          isDrawerOpen={isDrawerOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMobileMenuClose}
          onLogout={handleLogout}
        />
        
        <Box
          component="main"
          sx={{ 
            flexGrow: 1,
            transition: 'margin 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 1.5, lg: 2 }, overflow: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
      
      <Footer />
      
      <AccessibilityWidget />
      <DebugPanel />
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={handleCloseToast} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 