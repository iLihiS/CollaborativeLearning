

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  Home,
  Upload,
  BookOpen,
  FileText,
  HelpCircle,
  LogOut as LogOutIcon,
  Menu,
  Settings as SettingsIcon,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle,
  XCircle as XCircleIcon
} from "lucide-react";
import {
  Button,
  Avatar,
  Alert,
  Snackbar,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  CircularProgress,
  Paper,
  Divider
} from "@mui/material";
import { LoginForm } from "@/components/LoginForm";
import AccessibilityWidget from '@/components/AccessibilityWidget';

const MORNING_START = 6; // 6 AM
const EVENING_START = 22; // 10 PM

// eslint-disable-next-line react/prop-types
export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '' });

  useEffect(() => {
    document.title = 'למידה שיתופית בקריה האקדמית אונו';
    document.documentElement.setAttribute('dir', 'rtl');
    
    const faviconUrl = 'https://yedion.ono.ac.il/info/images/Favicon.ico';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, []);

  useEffect(() => {
    loadUser();
  }, [location.pathname]);

  const loadUser = async () => {
    setLoading(true);

    const currentHour = new Date().getHours();
    let defaultTheme = 'dark';
    if (currentHour >= MORNING_START && currentHour < EVENING_START) {
        defaultTheme = 'light';
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
        const savedTheme = localStorage.getItem('theme') || defaultTheme;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedTheme);
        setUser(null);
        setLoading(false);
        return;
    }
    
    try {
        const currentUser = await User.me();
        setUser(currentUser);

        let themeToUse = sessionStorage.getItem('session_theme');
        if (!themeToUse) {
            themeToUse = currentUser.theme_preference || localStorage.getItem('theme') || defaultTheme;
        }
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(themeToUse);
    } catch {
        console.log("User not authenticated");
        const savedTheme = localStorage.getItem('theme') || defaultTheme;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedTheme);
        localStorage.removeItem('auth_token');
        setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setToast({ open: true, message: "התנתקת בהצלחה מהמערכת" });
    } catch (error) {
      console.error('Logout error:', error);
      setToast({ open: true, message: "התנתקות הושלמה, נתוני המערכת נוקו בהצלחה" });
    }
    sessionStorage.removeItem('session_theme');
    setUser(null);
    setLoading(false);
    setTimeout(() => {
      setUser(null);
    }, 1000);
  };

  const getNavigationItems = () => {
    if (!user) return [];
    const currentRole = user.current_role || (user.role === 'admin' ? 'admin' : (user.role === 'lecturer' ? 'lecturer' : 'student'));
    const allNavItems = [
      { title: "דף הבית", url: createPageUrl("Dashboard"), icon: Home, roles: ["student", "lecturer", "admin"] },
      { title: "הקבצים שלי", url: createPageUrl("MyFiles"), icon: FileText, roles: ["student", "lecturer", "admin"] },
      { title: "קורסים", url: createPageUrl("Courses"), icon: BookOpen, roles: ["student", "lecturer", "admin"] },
      { title: "העלאת קובץ", url: createPageUrl("UploadFile"), icon: Upload, roles: ["student", "lecturer", "admin"] },
      { title: "תובנות", url: createPageUrl("Insights"), icon: BarChart3, roles: ["student", "lecturer", "admin"] },
      { title: "התראות", url: createPageUrl("Notifications"), icon: Bell, roles: ["student", "lecturer", "admin"] },
      { title: "מעקב פניות", url: createPageUrl("TrackInquiries"), icon: MessageSquare, roles: ["student", "lecturer", "admin"] },
      { title: "עזרה", url: createPageUrl("Help"), icon: HelpCircle, roles: ["student", "lecturer", "admin"] },
      { title: "קבצים ממתינים", url: createPageUrl("LecturerPendingFiles"), icon: Clock, roles: ["lecturer", "admin"] },
      { title: "קבצים מאושרים", url: createPageUrl("LecturerApprovedFiles"), icon: CheckCircle, roles: ["lecturer", "admin"] },
      { title: "קבצים שנדחו", url: createPageUrl("LecturerRejectedFiles"), icon: XCircleIcon, roles: ["lecturer", "admin"] },
      { title: "פאנל ניהול", url: createPageUrl("AdminPanel"), icon: SettingsIcon, roles: ["admin"] },
    ];
    return allNavItems.filter(item => item.roles.includes(currentRole));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleLoginSuccess = async () => {
    try {
      setLoading(true);
      await loadUser();
      setToast({ open: true, message: "התחברת בהצלחה למערכת" });
      setLoginError('');
    } catch (error) {
      console.error('Error loading user after login:', error);
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    setLoginError(error);
    setLoading(false);
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast({ ...toast, open: false });
  };

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
          message={toast.message}
        />
      </div>
    );
  }

  const navigationItems = getNavigationItems();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'var(--bg-sidebar)' }}>
      <Toolbar>
        <Link to={createPageUrl("Dashboard")} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box sx={{ width: 40, height: 40, bgcolor: 'primary.main', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 3 }}>
            <GraduationCap style={{ width: 24, height: 24, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
              למידה שיתופית
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--lime-primary)' }}>
              בקריה האקדמית אונו
            </Typography>
          </Box>
        </Link>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, p: 2, direction: 'rtl' }}>
        {navigationItems.map((item) => (
          <ListItem key={item.title} disablePadding sx={{ mb: 1 , justifyItems: 'center'}}>
            <ListItemButton
              component={Link}
              to={item.url}
              sx={{
                borderRadius: '12px',
                alignItems: 'flex-start',
                '&.Mui-selected': {
                  background: 'linear-gradient(to right, #84cc16, #65a30d)',
                  color: 'white',
                  boxShadow: 3,
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                 '&:hover': {
                  backgroundColor: '#ebfaca',
                  color: '#52820e',
                  borderColor: '#52820e',
                 }
              }}
              selected={location.pathname === item.url}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'var(--text-secondary)' }}>
                <item.icon style={{ width: 20, height: 20 }} />
              </ListItemIcon>
              <ListItemText primary={item.title} sx={{ textAlign: 'right', color: 'var(--text-primary)'}} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Paper elevation={0} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px', background: 'linear-gradient(to right, #f0fdf4, #e2f5d8)'}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 40, height: 40 }}>
                {user?.full_name?.charAt(0) || 'מ'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap fontWeight="bold" sx={{ color: 'var(--text-primary)'}}>
                  {user?.full_name || 'משתמש'}
                </Typography>
                <Typography variant="body2" noWrap sx={{ color: 'var(--lime-secondary)' }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            <IconButton component={Link} to={createPageUrl("Settings")} size="small">
              <SettingsIcon />
            </IconButton>
        </Paper>
        <Button
          fullWidth
          variant="text"
          startIcon={<LogOutIcon />}
          onClick={handleLogout}
          sx={{ mt: 1, color: 'error.main' }}
        >
          התנתקות
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
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
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', lg: 'none' },
          backdropFilter: 'blur(12px)',
          backgroundColor: 'var(--bg-sidebar)',
          boxShadow: 'none',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            למידה שיתופית
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { lg: 240 }, flexShrink: { lg: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          ModalProps={{
            keepMounted: true, 
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { lg: 'calc(100% - 240px)' } }}
      >
        <Toolbar />
        {children}
      </Box>
      
      <AccessibilityWidget />
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        message={toast.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

