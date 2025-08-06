
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Student, Lecturer } from '@/api/entities';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Grid,
    Box,
    Button,
    Menu,
    MenuItem,
    Avatar
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
  const [userRoles, setUserRoles] = useState([]);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      const currentUser = await User.me();
      const [studentRecords, lecturerRecords] = await Promise.all([
        Student.filter({ email: currentUser.email }),
        Lecturer.filter({ email: currentUser.email }),
      ]);

      const roles = [];
      if (studentRecords.length > 0) roles.push('student');
      if (lecturerRecords.length > 0) roles.push('lecturer');
      roles.push('admin');
      setUserRoles(roles);
    } catch (error) {
      console.error("Error loading user roles:", error);
    }
  };

  const switchRole = async (newRole) => {
    handleClose();
    try {
      await User.updateMyUserData({ current_role: newRole });
      if (newRole === 'student') {
        navigate(createPageUrl('Dashboard'));
      } else if (newRole === 'lecturer') {
        navigate(createPageUrl('LecturerPendingFiles'));
      }
    } catch (error) {
      console.error("Error switching role:", error);
    }
  };

  const adminLinks = [
    { title: "ניהול סטודנטים", icon: Users, url: "AdminStudentManagement", description: "הוספה, עריכה ומחיקה של סטודנטים", color: "info" },
    { title: "ניהול קורסים", icon: Book, url: "AdminCourseManagement", description: "ניהול קורסים וסמסטרים", color: "success" },
    { title: "ניהול קבצים", icon: FileText, url: "AdminFileManagement", description: "צפייה וניהול של כל הקבצים במערכת", color: "warning" },
    { title: "ניהול מרצים", icon: GraduationCap, url: "AdminLecturerManagement", description: "הוספה וניהול של סגל המרצים", color: "secondary" },
    { title: "ניהול מנהלים", icon: Settings, url: "AdminManagement", description: "ניהול מנהלי המערכת והרשאותיהם", color: "primary" },
  ];

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 48, height: 48 }}>
                    <Settings />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold">פאנל ניהול</Typography>
                    <Typography color="text.secondary">ניהול מרכזי של כל רכיבי המערכת</Typography>
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
                <Grid item xs={12} sm={6} md={4} lg={3} key={link.title}>
                    <Card
                        component={Link}
                        to={createPageUrl(link.url)}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            textDecoration: 'none',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: 6,
                            }
                        }}
                    >
                        <CardHeader
                            avatar={
                                <Avatar sx={{ bgcolor: `${link.color}.light`, color: `${link.color}.main`, width: 56, height: 56 }}>
                                    <link.icon />
                                </Avatar>
                            }
                            title={<Typography variant="h6" component="h2">{link.title}</Typography>}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" color="text.secondary">{link.description}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    </Box>
  );
}
