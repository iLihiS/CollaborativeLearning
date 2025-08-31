
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Student, Lecturer } from '@/api/entities';
import {
    Typography,
    Grid,
    Box,
    Button,
    Menu,
    MenuItem,
    Avatar,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Users,
    Book,
    FileText,
    GraduationCap,
    Settings,
    ChevronDown
} from 'lucide-react';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [toast, setToast] = useState({ open: false, message: '' });

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCloseToast = () => {
        setToast({ open: false, message: '' });
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            let roles: string[] = [];
            const [studentRecords, lecturerRecords] = await Promise.all([
                Student.filter({ email: currentUser.email }),
                Lecturer.filter({ email: currentUser.email }),
            ]);

            if (studentRecords.length > 0) roles.push('student');
            if (lecturerRecords.length > 0) roles.push('lecturer');
            if (currentUser.role === 'admin') roles.push('admin');
            setUserRoles(roles.sort());

        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    const switchRole = async (newRole: string) => {
        handleClose();
        try {
            await User.updateMyUserData({ current_role: newRole });
            // Save toast message to sessionStorage to show after reload
            const roleHebrew = newRole === 'student' ? 'סטודנט' : newRole === 'lecturer' ? 'מרצה' : 'מנהל';
            sessionStorage.setItem('roleChangeMessage', `עברת בהצלחה לתצוגת ${roleHebrew}`);
            // Navigate to Dashboard and reload immediately
            window.location.href = createPageUrl("Dashboard");
        } catch (error) {
            console.error("Error switching role:", error);
            setToast({ open: true, message: 'שגיאה במעבר בין תפקידים' });
        }
    };

  const adminLinks = [
    { title: "ניהול סטודנטים", icon: Users, url: "AdminStudentManagement", description: "הוספה, עריכה ומחיקה של סטודנטים", bgcolor: "#faf5ff", iconColor: "#8b5cf6" },
    { title: "ניהול קורסים", icon: Book, url: "AdminCourseManagement", description: "ניהול קורסים וסמסטרים", bgcolor: "#f0f9ff", iconColor: "#0ea5e9" },
    { title: "ניהול קבצים", icon: FileText, url: "AdminFileManagement", description: "צפייה וניהול של כל הקבצים במערכת", bgcolor: "#fefce8", iconColor: "#eab308" },
    { title: "ניהול מרצים", icon: GraduationCap, url: "AdminLecturerManagement", description: "הוספה וניהול של סגל המרצים", bgcolor: "#fdf2f8", iconColor: "#ec4899" },
    { title: "ניהול מנהלים", icon: Settings, url: "AdminManagement", description: "ניהול מנהלי המערכת והרשאותיהם", bgcolor: "#f0fdf4", iconColor: "#22c55e" },
  ];

  return (
    <>
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '80vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 48, height: 48 }}>
                    <Settings />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold" textAlign="left">פאנל ניהול</Typography>
                    <Typography color="text.secondary" textAlign="left">ניהול מרכזי של כל רכיבי המערכת</Typography>
                </Box>
            </Box>
            
            {userRoles.length > 1 && (
                <>
                    <Button
                        id="role-button"
                        aria-controls={open ? 'role-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleClick}
                        variant="outlined"
                        startIcon={<Settings />}
                        endIcon={<ChevronDown />}
                    >
                        מנהל
                    </Button>
                    <Menu
                        id="role-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{ 'aria-labelledby': 'role-button' }}
                    >
                        {userRoles.filter(r => r !== 'admin').map(role => {
                            if (role === 'student') return <MenuItem key="student" onClick={() => switchRole('student')}>מעבר לתצוגת סטודנט</MenuItem>
                            if (role === 'lecturer') return <MenuItem key="lecturer" onClick={() => switchRole('lecturer')}>מעבר לתצוגת מרצה</MenuItem>
                            return null;
                        })}
                    </Menu>
                </>
            )}
        </Box>

        <Grid container spacing={3}>
          {adminLinks.map((link) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={link.title}>
              <Paper
                component={Link}
                to={createPageUrl(link.url)}
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                  transition: 'all 0.2s',
                  border: 1,
                  borderColor: 'divider',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <Avatar sx={{ bgcolor: link.bgcolor, color: link.iconColor, mx: 'auto', width: 56, height: 56 }}>
                  <link.icon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" textAlign="center">{link.title}</Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">{link.description}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
    </Box>
    
    <Snackbar
        open={toast.open}
        autoHideDuration={3000}
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
    </>
  );
}
