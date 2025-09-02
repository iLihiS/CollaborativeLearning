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

        /* Apply dark theme to body and main content */
        .dark body,
        .dark #root {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }

        .dark .MuiPaper-root:not(.MuiAppBar-root) {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .dark .MuiTypography-colorTextSecondary {
          color: var(--text-secondary) !important;
        }

        .dark .MuiCard-root {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .dark .MuiCardContent-root {
          color: var(--text-primary);
        }

        .dark .MuiTextField-root {
          background-color: var(--bg-card);
        }

        .dark .MuiTextField-root .MuiInputBase-root {
          color: var(--text-primary);
          background-color: var(--bg-card);
        }

        .dark .MuiTextField-root .MuiInputLabel-root {
          color: var(--text-secondary);
        }

        .dark .MuiFormControl-root {
          background-color: var(--bg-card);
        }

        .dark .MuiSelect-root {
          color: var(--text-primary);
          background-color: var(--bg-card);
        }

        .dark .MuiMenuItem-root {
          color: var(--text-primary);
          background-color: var(--bg-card);
        }

        .dark .MuiMenuItem-root:hover {
          background-color: var(--border-color);
        }

        .dark .MuiChip-root {
          background-color: var(--border-color);
          color: var(--text-primary);
        }

        .dark .MuiDivider-root {
          border-color: var(--border-color);
        }

        .dark .MuiButton-text {
          color: var(--text-primary);
        }

        .dark .MuiIconButton-root {
          color: var(--text-secondary);
        }

        /* Handle skeleton loading in dark mode */
        .dark .MuiSkeleton-root {
          background-color: var(--border-color);
        }

        /* Handle autocomplete dropdown in dark mode */
        .dark .MuiAutocomplete-popup {
          background-color: var(--bg-card);
        }

        .dark .MuiAutocomplete-listbox {
          background-color: var(--bg-card);
        }

        .dark .MuiAutocomplete-option {
          color: var(--text-primary);
        }

        .dark .MuiAutocomplete-option[aria-selected="true"] {
          background-color: var(--border-color);
        }

        /* Handle menu dropdowns */
        .dark .MuiMenu-paper {
          background-color: var(--bg-card);
        }

        /* Handle togglebutton groups */
        .dark .MuiToggleButtonGroup-root {
          background-color: var(--bg-card);
        }

        .dark .MuiToggleButton-root {
          color: var(--text-primary);
          background-color: var(--bg-card);
          border-color: var(--border-color);
        }

        .dark .MuiToggleButton-root.Mui-selected {
          background-color: var(--lime-primary);
          color: white;
        }

        /* Handle grid backgrounds */
        .dark .MuiGrid-root {
          color: var(--text-primary);
        }

        /* Handle tables */
        .dark .MuiTable-root {
          background-color: var(--bg-card);
        }

        .dark .MuiTableHead-root {
          background-color: var(--border-color);
        }

        .dark .MuiTableCell-root {
          color: var(--text-primary);
          border-color: var(--border-color);
        }

        .dark .MuiTableRow-root:hover {
          background-color: var(--border-color);
        }

        /* Handle alerts and snackbars */
        .dark .MuiAlert-root {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .dark .MuiSnackbar-root {
          background-color: var(--bg-card);
        }

        /* Handle progress bars */
        .dark .MuiLinearProgress-root {
          background-color: var(--border-color);
        }

        /* Handle dialogs */
        .dark .MuiDialog-paper {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .dark .MuiDialogTitle-root {
          color: var(--text-primary);
        }

        .dark .MuiDialogContent-root {
          color: var(--text-primary);
        }

        .dark .MuiDialogActions-root {
          background-color: var(--bg-card);
        }

        /* Handle specific components that might have hard-coded colors */
        .dark .MuiAccordion-root {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .dark .MuiAccordionSummary-root {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        .dark .MuiAccordionDetails-root {
          background-color: var(--bg-card);
          color: var(--text-primary);
        }

        /* Handle text colors more selectively */
        .dark .MuiCard-root .MuiTypography-root {
          color: var(--text-primary);
        }

        .dark .MuiPaper-root .MuiTypography-root {
          color: var(--text-primary);
        }

        /* Handle input focused states */
        .dark .MuiTextField-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: var(--lime-primary);
        }

        .dark .MuiTextField-root .MuiInputLabel-root.Mui-focused {
          color: var(--lime-primary);
        }

        /* Keep Header and Sidebar user profile unchanged in dark mode */
        .dark .MuiAppBar-root {
          background: linear-gradient(to right, #84cc16, #65a30d) !important;
          color: white !important;
        }

        .dark .MuiAppBar-root * {
          color: white !important;
        }

        /* Keep Sidebar user profile colors unchanged in dark mode */
        .dark .sidebar-user-profile .MuiTypography-root {
          color: #1e293b !important;
        }

        .dark .sidebar-user-profile .MuiTypography-caption {
          color: #65a30d !important;
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
            overflow: 'hidden',
            bgcolor: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }}
        >
          <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 1.5, lg: 2 }, overflow: 'auto', bgcolor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
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