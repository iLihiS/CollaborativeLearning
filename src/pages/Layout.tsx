

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserEntity } from "@/api/entities.ts";
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
  Divider,
  Badge
} from "@mui/material";
import { LoginForm } from "@/components/LoginForm.tsx";
import AccessibilityWidget from '@/components/AccessibilityWidget.tsx';

const MORNING_START = 6; // 6 AM
const EVENING_START = 22; // 10 PM

type User = {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  current_role: string;
  theme_preference: string;
};

// eslint-disable-next-line react/prop-types
export default function Layout({ children, currentPageName }: { children: React.ReactNode, currentPageName: string }) {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '' });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unhandledInquiries, setUnhandledInquiries] = useState(0);

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

  useEffect(() => {
    loadUser();
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      loadNotificationCounts();
    }
  }, [user]);

  const loadNotificationCounts = async () => {
    try {
      if (!user) return;
      
      // Import the entities we need
      const { Notification, Message } = await import("@/api/entities");
      
      // Load unread notifications
      const notifications = await Notification.filter({ 
        user_email: user.email, 
        is_read: false 
      });
      setUnreadNotifications(notifications.length);
      
      // Load unhandled inquiries (only for admin/lecturer)
      if (user.current_role === 'admin' || user.current_role === 'lecturer') {
        const inquiries = await Message.filter({ status: 'pending' });
        setUnhandledInquiries(inquiries.length);
      } else {
        // For students, show their own pending inquiries
        const inquiries = await Message.filter({ 
          sender_email: user.email, 
          status: 'pending' 
        });
        setUnhandledInquiries(inquiries.length);
      }
    } catch (error) {
      console.error("Error loading notification counts:", error);
    }
  };

  const loadUser = async () => {
    setLoading(true);

    const currentHour = new Date().getHours();
    let defaultTheme = 'dark';
    if (currentHour >= MORNING_START && currentHour < EVENING_START) {
        defaultTheme = 'light';
    }

    const token = localStorage.getItem('auth_token');
    console.log('loadUser - token from localStorage:', token);
    
    if (!token) {
        console.log('loadUser - no token found, setting user to null');
        const savedTheme = localStorage.getItem('theme') || defaultTheme;
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(savedTheme);
        setUser(null);
        setLoading(false);
        return;
    }
    
    console.log('loadUser - token found, trying to get user');
    try {
        console.log('Layout - trying to load user...');
        const currentUser = await UserEntity.me();
        console.log('Layout - user loaded successfully:', currentUser);
        setUser(currentUser);

        let themeToUse = sessionStorage.getItem('session_theme');
        if (!themeToUse) {
            themeToUse = currentUser.theme_preference || localStorage.getItem('theme') || defaultTheme;
        }
        
        document.documentElement.classList.remove('light', 'dark');
        if (themeToUse) {
            document.documentElement.classList.add(themeToUse);
        }
    } catch (error) {
        console.log("User not authenticated, error:", error);
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
      await UserEntity.logout();
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
    const currentRole = user.current_role;
    const allNavItems = [
      { title: "דף הבית", url: createPageUrl("Dashboard"), icon: Home, roles: ["student", "lecturer", "admin"] },
      { title: "פאנל ניהול", url: createPageUrl("AdminPanel"), icon: SettingsIcon, roles: ["admin"] },
      { title: "הקבצים שלי", url: createPageUrl("MyFiles"), icon: FileText, roles: ["student", "lecturer", "admin"] },
      { title: "קבצים ממתינים", url: createPageUrl("LecturerPendingFiles"), icon: Clock, roles: ["lecturer", "admin"] },
      { title: "קבצים מאושרים", url: createPageUrl("LecturerApprovedFiles"), icon: CheckCircle, roles: ["lecturer", "admin"] },
      { title: "קבצים שנדחו", url: createPageUrl("LecturerRejectedFiles"), icon: XCircleIcon, roles: ["lecturer", "admin"] },
      { title: "קורסים", url: createPageUrl("Courses"), icon: BookOpen, roles: ["student", "lecturer", "admin"] },
      { title: "העלאת קובץ", url: createPageUrl("UploadFile"), icon: Upload, roles: ["student", "lecturer", "admin"] },
      { title: "תובנות", url: createPageUrl("Insights"), icon: BarChart3, roles: ["student", "lecturer", "admin"] },
      { title: "התראות", url: createPageUrl("Notifications"), icon: Bell, roles: ["student", "lecturer", "admin"] },
      { title: "מעקב פניות", url: createPageUrl("TrackInquiries"), icon: MessageSquare, roles: ["student", "lecturer", "admin"] },
      { title: "עזרה", url: createPageUrl("Help"), icon: HelpCircle, roles: ["student", "lecturer", "admin"] },
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
    console.log('handleLoginSuccess called');
    try {
      setLoading(true);
      console.log('handleLoginSuccess - calling loadUser');
      await loadUser();
      setToast({ open: true, message: "התחברת בהצלחה למערכת" });
      setLoginError('');
    } catch (error) {
      console.error('Error loading user after login:', error);
      setLoading(false);
    }
  };

  const handleLoginError = (error: string) => {
    setLoginError(error);
    setLoading(false);
  };

  const handleCloseToast = (event: React.SyntheticEvent | Event, reason?: string) => {
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

  const navigationItems = getNavigationItems();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'var(--bg-sidebar)', overflow: 'hidden' }}>
      <List sx={{ flexGrow: 1, p: 1.5, direction: 'rtl', overflow: 'auto' }}>
        {navigationItems.map((item) => (
          <ListItem key={item.title} disablePadding sx={{ mb: 0.75, justifyItems: 'center'}}>
            <ListItemButton
              component={Link}
              to={item.url}
              sx={{
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'space-between',
                direction: 'rtl',
                py: 1,
                height: '45px',
                '&.Mui-selected': {
                  background: 'linear-gradient(to right, #84cc16, #65a30d)',
                  color: 'white',
                  boxShadow: 3,
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '& .MuiListItemText-primary': {
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
              <ListItemIcon sx={{ minWidth: 40, color: 'var(--text-secondary)', align: 'end' }}>
                <item.icon style={{ width: 20, height: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                primaryTypographyProps={{
                  sx: {
                    fontSize: '1rem',
                    textAlign: 'left'
                  }
                }}
                sx={{
                  color: 'var(--text-primary)'
                }} 
              />
              
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Paper elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', background: 'linear-gradient(to right, #f0fdf4, #e2f5d8)'}}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 38, height: 38 }}>
                {user.full_name?.charAt(0) || 'מ'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap fontWeight="bold" sx={{ color: 'var(--text-primary)', fontSize: '0.9rem'}}>
                  {user.full_name || 'משתמש'}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: 'var(--lime-secondary)', fontSize: '0.8rem' }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <IconButton component={Link} to={createPageUrl("Settings")} size="small">
              <SettingsIcon style={{ width: 18, height: 18 }} />
            </IconButton>
        </Paper>
        <Button
          fullWidth
          variant="text"
          startIcon={<LogOutIcon style={{ width: 18, height: 18 }} />}
          onClick={handleLogout}
          sx={{ 
            mt: 1.5, 
            color: 'error.main',
            py: 0.75,
            fontSize: '0.9rem'
          }}
        >
          התנתקות
        </Button>
      </Box>
    </Box>
  );

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
      
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(to right, #84cc16, #65a30d)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar sx={{ minHeight: '48px !important', py: 0, position: 'relative' }}>
          {/* Left side - Menu and Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsDrawerOpen(!isDrawerOpen);
              }}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            
            <Box 
              component={Link}
              to={createPageUrl("Dashboard")}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                textDecoration: 'none',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
              >
                <GraduationCap style={{ width: 18, height: 18, color: 'white' }} />
              </Box>
              
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  fontSize: '1.1rem'
                }}
              >
                למידה שיתופית
              </Typography>
              
              <Typography 
                variant="body1"
                sx={{ 
                  color: 'white',
                  fontWeight: 300,
                  opacity: 0.9,
                  lineHeight: 1,
                  fontSize: '1rem'
                }}
              >
                בקריה האקדמית אונו
              </Typography>
            </Box>
          </Box>

          {/* Center - Quote - Absolutely positioned for true center */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: { xs: 'none', md: 'block' }
            }}
          >
            <Typography 
              variant="body2"
              sx={{ 
                color: 'white',
                fontStyle: 'italic',
                opacity: 0.8,
                fontSize: '0.85rem',
                direction: 'ltr'
              }}
            >
              " When you share successes, you succeed more "
            </Typography>
          </Box>

          {/* Right side - Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <IconButton
              component={Link}
              to={createPageUrl("Notifications")}
              sx={{ 
                color: 'white',
                position: 'relative',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <Bell style={{ width: 20, height: 20 }} />
              </Badge>
            </IconButton>
            
            <IconButton
              component={Link}
              to={createPageUrl("TrackInquiries")}
              sx={{ 
                color: 'white',
                position: 'relative',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <Badge badgeContent={unhandledInquiries} color="warning">
                <MessageSquare style={{ width: 20, height: 20 }} />
              </Badge>
            </IconButton>
            
            <IconButton
              component={Link}
              to={createPageUrl("Help")}
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <HelpCircle style={{ width: 20, height: 20 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar and main content */}
        <Box
          component="nav"
          sx={{ 
            width: { xs: 0, lg: isDrawerOpen ? 240 : 0 }, 
            flexShrink: 0,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            height: '100%'
          }}
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
          
          {/* Desktop sidebar as regular Box */}
          <Box
            sx={{
              display: { xs: 'none', lg: isDrawerOpen ? 'block' : 'none' },
              width: 240,
              height: '100%',
              transition: 'opacity 0.3s ease',
              overflow: 'auto'
            }}
          >
            {drawerContent}
          </Box>
        </Box>
        
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
          <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
      
      {/* Footer - at bottom of page */}
      <Box
        component="footer"
        sx={{
          py: 0.25,
          px: 2,
          backgroundColor: 'grey.100',
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          width: '100%',
          minHeight: 'auto'
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
          © {new Date().getFullYear()} מערכת זו נבנתה על ידי <Box component="span" sx={{ fontWeight: 'bold' }}>ליהי סער</Box>
        </Typography>
      </Box>
      
      <AccessibilityWidget />
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
}
