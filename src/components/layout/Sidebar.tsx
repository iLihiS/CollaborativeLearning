import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Avatar,
  Typography,
  Button,
  IconButton
} from "@mui/material";
import {
  Home,
  Upload,
  BookOpen,
  FileText,
  HelpCircle,
  LogOut as LogOutIcon,
  Settings as SettingsIcon,
  BarChart3,
  Bell,
  Clock,
  CheckCircle,
  XCircle as XCircleIcon,
  MessageSquare
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { User, UserRole } from "@/types";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  roles: string[];
}

interface SidebarProps {
  user: User | null;
  isDrawerOpen: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  onLogout: () => void;
}

const getNavigationItems = (user: User | null): NavigationItem[] => {
  if (!user || !user.current_role) return [];
  
  const currentRole = user.current_role;
  console.log(`🔍 Sidebar - Current role: ${currentRole}, User: ${user.full_name}`);
  
  const allNavItems: NavigationItem[] = [
    { title: "דף הבית", url: createPageUrl("Dashboard"), icon: Home, roles: ["student", "lecturer", "admin"] },
    { title: "פאנל ניהול", url: createPageUrl("AdminPanel"), icon: SettingsIcon, roles: ["admin"] },
    { title: "קבצים ממתינים", url: createPageUrl("LecturerPendingFiles"), icon: Clock, roles: ["lecturer", "admin"] },
    { title: "קבצים מאושרים", url: createPageUrl("LecturerApprovedFiles"), icon: CheckCircle, roles: ["lecturer", "admin"] },
    { title: "קבצים שנדחו", url: createPageUrl("LecturerRejectedFiles"), icon: XCircleIcon, roles: ["lecturer", "admin"] },
    { title: "הקבצים שלי", url: createPageUrl("MyFiles"), icon: FileText, roles: ["student", "lecturer", "admin"] },
    { title: "קורסים", url: createPageUrl("Courses"), icon: BookOpen, roles: ["student", "lecturer", "admin"] },
    { title: "העלאת קובץ", url: createPageUrl("UploadFile"), icon: Upload, roles: ["student", "lecturer", "admin"] },
    { title: "תובנות", url: createPageUrl("Insights"), icon: BarChart3, roles: ["student", "lecturer", "admin"] },
    { title: "התראות", url: createPageUrl("Notifications"), icon: Bell, roles: ["student", "lecturer", "admin"] },
    { title: "מעקב פניות", url: createPageUrl("TrackInquiries"), icon: MessageSquare, roles: ["student", "lecturer", "admin"] },
    { title: "עזרה", url: createPageUrl("Help"), icon: HelpCircle, roles: ["student", "lecturer", "admin"] },
  ];
  
  return allNavItems.filter(item => item.roles.includes(currentRole));
};

const SidebarContent = ({ user, onLogout }: { user: User | null; onLogout: () => void }) => {
  const location = useLocation();
  const navigationItems = getNavigationItems(user);

  if (!user) return null;

  return (
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
          onClick={onLogout}
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
};

export const Sidebar = ({ 
  user, 
  isDrawerOpen, 
  isMobileMenuOpen, 
  onMobileMenuClose, 
  onLogout 
}: SidebarProps) => {
  const sidebarContent = <SidebarContent user={user} onLogout={onLogout} />;

  return (
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
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={isMobileMenuOpen}
        onClose={onMobileMenuClose}
        ModalProps={{
          keepMounted: true, 
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {sidebarContent}
      </Drawer>
      
      {/* Desktop sidebar */}
      <Box
        sx={{
          display: { xs: 'none', lg: isDrawerOpen ? 'block' : 'none' },
          width: 240,
          height: '100%',
          transition: 'opacity 0.3s ease',
          overflow: 'auto',
          bgcolor: 'background.default'
        }}
      >
        {sidebarContent}
      </Box>
    </Box>
  );
}; 