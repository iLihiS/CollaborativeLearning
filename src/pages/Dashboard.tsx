import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserEntity, Course, File, Student, Lecturer, Message, Notification } from "@/api/entities";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Sun,
    Moon,
    ChevronDown,
    GraduationCap,
    MessageSquare,
    Plus,
    Heart,
    Users,
    Briefcase,
    FileCog,
    Shield
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Chip,
    LinearProgress,
    CircularProgress,
    Paper,
    IconButton,
    Snackbar,
    Alert
} from "@mui/material";
import Grid from '@mui/material/Grid';

import {
    MenuBook as BookOpen,
    Description as FileText,
    CloudUpload as Upload,
    AccessTime as Clock,
    CheckCircleOutline as CheckCircle,
    HighlightOff as XCircle
} from "@mui/icons-material";
import PropTypes from 'prop-types';

type User = {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
    current_role: string;
    theme_preference: string;
    national_id?: string;
    student_id?: string;
    academic_track?: string;
    academic_track_ids?: string[];
    department?: string;
};

const MORNING_START = 5;
const AFTERNOON_START = 12;
const EVENING_START = 18;
const NIGHT_START = 22;

export default function Dashboard() {
    const { session, switchRole: authSwitchRole } = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [recentFiles, setRecentFiles] = useState<any[]>([]);
    const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalFiles: 0,
        approvedFiles: 0,
        pendingFiles: 0,
        rejectedFiles: 0,
        totalDownloads: 0
    });
    const [greeting, setGreeting] = useState<{ text: string, icon: React.ReactNode }>({ text: "", icon: null });
    const [loading, setLoading] = useState(true);
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

    const getCurrentRoleIcon = () => {
        const currentRole = session?.current_role || user?.current_role;
        switch (currentRole) {
            case 'student':
                return <Users />;
            case 'lecturer':
                return <GraduationCap />;
            case 'admin':
                return <Shield />;
            default:
                return <Users />;
        }
    };

    useEffect(() => {
        const currentHour = new Date().getHours();
        if (currentHour >= MORNING_START && currentHour < AFTERNOON_START) {
            setGreeting({ text: "בוקר טוב", icon: <Sun style={{ width: 20, height: 20, color: '#fcd34d' }} /> });
        } else if (currentHour >= AFTERNOON_START && currentHour < EVENING_START) {
            setGreeting({ text: "צהריים טובים", icon: <Sun style={{ width: 20, height: 20, color: '#fcd34d' }} /> });
        } else if (currentHour >= EVENING_START && currentHour < NIGHT_START) {
            setGreeting({ text: "ערב טוב", icon: <Moon style={{ width: 20, height: 20, color: '#94a3b8' }} /> });
        } else {
            setGreeting({ text: "לילה טוב", icon: <Moon style={{ width: 20, height: 20, color: '#94a3b8' }} /> });
        }

        // Don't load data here - wait for session
    }, []);

    useEffect(() => {
        // Check for role change message after page reload
        const roleChangeMessage = sessionStorage.getItem('roleChangeMessage');
        if (roleChangeMessage) {
            setToast({ open: true, message: roleChangeMessage });
            sessionStorage.removeItem('roleChangeMessage');
        }
    }, []);

    // Update user data when session changes
    useEffect(() => {
        if (session?.user) {
            console.log('🔄 Session updated, loading dashboard data');
            setUser(session.user as any); // Cast to match local User type
            setUserRoles(session.available_roles || []);
            loadDashboardData();
        }
    }, [session]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading dashboard data...');
            
            // Always use session user - no fallback to API
            if (!session?.user) {
                console.log('❌ No session user available, stopping load');
                setLoading(false);
                return;
            }
            
            const currentUser = session.user;
            console.log('✅ Using session user:', currentUser.full_name);
            setUser(currentUser as any);

            // Use roles from session
            const roles = session.available_roles || [];
            console.log('✅ Using session roles:', roles);
            setUserRoles(roles);

            // Set basic demo data instead of complex API calls
            console.log('✅ Setting demo dashboard data');
            setRecentFiles([]);
            setRecentInquiries([]);
            setStats({
                totalFiles: 12,
                approvedFiles: 8,
                pendingFiles: 3,
                rejectedFiles: 1,
                totalDownloads: 45
            });
            
            console.log('✅ Dashboard loaded successfully');
        } catch (error: any) {
            console.error("Error loading dashboard data:", error);
        }
        setLoading(false);
    };



    const switchRole = async (newRole: string) => {
        handleClose();
        try {
            console.log(`🎯 Dashboard: Switching to role ${newRole}`);
            
            // Use the new auth system to switch roles
            const success = authSwitchRole(newRole as any);
            if (success) {
                console.log(`✅ Dashboard: Role switch successful`);
                // The useAuth hook will handle navigation and reload
            } else {
                console.log(`❌ Dashboard: Role switch failed`);
                setToast({ open: true, message: 'שגיאה במעבר בין תפקידים' });
            }
        } catch (error) {
            console.error("Error switching role:", error);
            setToast({ open: true, message: 'שגיאה במעבר בין תפקידים' });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
                <CircularProgress />
            </Box>
        );
    }

    const getInquiryStatusBadge = (status: string) => {
        if (status === 'handled') {
            return <Chip icon={<CheckCircle />} label="טופל" color="success" size="small" />;
        }
        return <Chip icon={<Clock />} label="ממתין" color="warning" size="small" />;
    };


    const StatCard = ({ to, icon, title, value, subtitle, color }: { to: string, icon: React.ReactNode, title: string, value: string | number, subtitle: string, color: string }) => {
        // Define pastel colors for each type
        const pastelColors = {
            error: { bg: '#fce4ec', color: '#e91e63' }, // Light pink background, pink icon for Heart (הורדות)
            info: { bg: '#e3f2fd', color: '#1976d2' }, // Light blue
            success: { bg: '#e8f5e8', color: '#388e3c' }, // Light green
            warning: { bg: '#fff3e0', color: '#f57c00' }, // Light orange
        };
        
        const colorConfig = pastelColors[color as keyof typeof pastelColors] || pastelColors.info;
        
        return (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
                <Paper component={Link} to={to} elevation={0} sx={{ 
                    p: { xs: 2, sm: 2.5 }, 
                    textAlign: 'center', 
                    height: '100%', 
                    minHeight: { xs: 'auto', sm: '140px' },
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }, 
                    transition: 'all 0.2s', 
                    border: 1, 
                    borderColor: 'divider' 
                }}>
                    <Avatar sx={{ 
                        bgcolor: colorConfig.bg, 
                        color: colorConfig.color, 
                        mx: 'auto', 
                        mb: { xs: 0.5, sm: 1 }, 
                        width: { xs: 32, sm: 40 }, 
                        height: { xs: 32, sm: 40 } 
                    }}>
                        {icon}
                    </Avatar>
                    <Typography 
                        variant="h5" 
                        fontWeight="bold" 
                        sx={{ 
                            textAlign: 'center', 
                            mb: 0.5,
                            fontSize: { xs: '1.1rem', sm: '1.5rem' }
                        }}
                    >
                        {value}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                            textAlign: 'center',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            lineHeight: 1.3,
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                            textAlign: 'center', 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            lineHeight: 1.3,
                            wordBreak: 'break-word',
                            hyphens: 'auto'
                        }}
                    >
                        {subtitle}
                    </Typography>
                </Paper>
            </Grid>
        );
    };

    StatCard.propTypes = {
        to: PropTypes.string.isRequired,
        icon: PropTypes.element.isRequired,
        title: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        subtitle: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    };

    const AdminQuickLink = ({ to, icon, title, subtitle, color }: { to: string, icon: React.ReactNode, title: string, subtitle: string, color: string }) => {
        // Define pastel colors for admin links
        const pastelColors = {
            info: { bg: '#e3f2fd', color: '#1976d2' }, // Light blue for courses
            success: { bg: '#e8f5e8', color: '#388e3c' }, // Light green for students
            secondary: { bg: '#f3e5f5', color: '#7b1fa2' }, // Light purple for lecturers
            warning: { bg: '#fff3e0', color: '#f57c00' }, // Light orange for files
        };
        
        const colorConfig = pastelColors[color as keyof typeof pastelColors] || pastelColors.info;
        
        return (
            <Grid size={{ xs: 6, sm: 3, md: 2}}>
                <Paper component={Link} to={to} elevation={0} sx={{ 
                    p: 2.5, 
                    textAlign: 'center', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }, 
                    transition: 'all 0.2s', 
                    border: 1, 
                    borderColor: 'divider' 
                }}>
                    <Avatar sx={{ bgcolor: colorConfig.bg, color: colorConfig.color, mx: 'auto', mb: 0.5, width: 32, height: 32 }}>
                        {icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" sx={{ textAlign: 'center' }}>ניהול</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>{subtitle}</Typography>
                </Paper>
            </Grid>
        );
    };

    AdminQuickLink.propTypes = {
        to: PropTypes.string.isRequired,
        icon: PropTypes.element.isRequired,
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    };

    return (
        <>
        <Box sx={{ bgcolor: 'background.default', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper elevation={0} sx={{
                borderRadius: '24px',
                p: { xs: 2, sm: 3, lg: 3, xl: 3 },
                mb: 2,
                minHeight: { xs: '240px', sm: '200px', md: '200px', lg: '200px', xl: '200px' },
                color: 'white',
                background: 'linear-gradient(to right, #84cc16, #65a30d)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 3s infinite',
                },
                '@keyframes shimmer': {
                    '0%': { left: '-100%' },
                    '100%': { left: '100%' }
                }
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'center', sm: 'flex-start' }, 
                    gap: 2, 
                    flexDirection: { xs: 'column', sm: 'row' },
                    flex: 1
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        <Avatar sx={{ 
                            width: { xs: 40, sm: 48 }, 
                            height: { xs: 40, sm: 48 }, 
                            bgcolor: 'rgba(255,255,255,0.2)' 
                        }}>
                            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{user?.full_name?.charAt(0) || 'L'}</Typography>
                        </Avatar>
                        <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                            <Typography sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                justifyContent: { xs: 'center', sm: 'flex-start' }
                            }}>
                                {greeting.text} {greeting.icon}
                            </Typography>
                            <Typography 
                                variant="h5" 
                                fontWeight="bold"
                                sx={{ 
                                    fontSize: { xs: '1.1rem', sm: '1.5rem' },
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word'
                                }}
                            >
                                {user?.full_name || 'משתמש'}
                            </Typography>
                        </Box>
                    </Box>

                    {(session?.available_roles?.length || userRoles.length) > 1 ? (
                        <>
                            <Button
                                id="role-button"
                                aria-controls={open ? 'role-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                onClick={handleClick}
                                variant="contained"
                                color="inherit"
                                sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.2)', 
                                    color: 'white',
                                    '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                                        color: 'white'
                                    },
                                    '&:hover': { 
                                        bgcolor: 'white', 
                                        color: '#2e7d32',
                                        '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                                            color: '#2e7d32'
                                        }
                                    },
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    px: 2,
                                    '& .MuiButton-startIcon': {
                                        mr: { xs: 0, sm: 1 }
                                    },
                                    '& .button-text': {
                                        display: { xs: 'none', sm: 'inline' }
                                    }
                                }}
                                startIcon={getCurrentRoleIcon()}
                                endIcon={<ChevronDown />}
                            >
                                <Box component="span" className="button-text">
                                    {(() => {
                                        const currentRole = session?.current_role || user?.current_role;
                                        return currentRole === 'lecturer' ? 'מרצה' : currentRole === 'admin' ? 'מנהל' : 'סטודנט';
                                    })()}
                                </Box>
                            </Button>
                            <Menu
                                id="role-menu"
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                MenuListProps={{ 'aria-labelledby': 'role-button' }}
                            >
                                {(() => {
                                    const currentRole = session?.current_role || user?.current_role;
                                    const availableRoles = session?.available_roles || userRoles;
                                    
                                    return (
                                        <>
                                            {availableRoles.includes('student') && currentRole !== 'student' && (
                                                <MenuItem onClick={() => switchRole('student')}>מעבר לתצוגת סטודנט</MenuItem>
                                            )}
                                            {availableRoles.includes('lecturer') && currentRole !== 'lecturer' && (
                                                <MenuItem onClick={() => switchRole('lecturer')}>מעבר לתצוגת מרצה</MenuItem>
                                            )}
                                            {availableRoles.includes('admin') && currentRole !== 'admin' && (
                                                <MenuItem onClick={() => switchRole('admin')}>מעבר לתצוגת מנהל</MenuItem>
                                            )}
                                        </>
                                    );
                                })()}
                            </Menu>
                        </>
                    ) : (
                        <Button variant="contained" color="inherit" sx={{ cursor: 'default' }} startIcon={<GraduationCap />}>
                            {user?.current_role === 'lecturer' ? 'מרצה' : user?.current_role === 'admin' ? 'מנהל' : 'סטודנט'}
                        </Button>
                    )}
                </Box>
                                <Box sx={{ 
                    mt: { xs: 1, sm: 3 }, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'center', sm: 'flex-end' }, 
                    gap: 2, 
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexShrink: 0
                }}>
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: { xs: '100%', sm: 'auto' } }}>
                        <Typography sx={{ 
                            mb: { xs: 1, sm: 2 }, 
                            display: { xs: 'block', sm: 'block' },
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            textAlign: { xs: 'center', sm: 'right' },
                            lineHeight: 1.4
                        }}>
                            ברוכים הבאים לשיתוף האקדמי שלכם
                        </Typography>
                        <Button 
                            component={Link} 
                            to={createPageUrl("UploadFile")} 
                            variant="contained" 
                            color="inherit" 
                            startIcon={<Upload />}
                            sx={{ 
                                bgcolor: 'white', 
                                color: 'primary.main', 
                                border: '2px solid white',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                px: 2,
                                py: 1,
                                '&:hover': { 
                                    bgcolor: 'transparent', 
                                    color: 'white',
                                    borderColor: 'white'
                                }
                            }}
                        >
                            העלאת קובץ חדש
                        </Button>
                    </Box>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            order: { xs: -1, sm: 0 }
                        }}
                    >
                        <Clock style={{ width: 16, height: 16 }} />
                        {format(new Date(), 'HH:mm d.M.yyyy', { locale: he })}
                    </Typography>
                </Box>
            </Paper>

            {user?.current_role === 'admin' ? (
                <Grid container spacing={2} justifyContent="center">
                    <AdminQuickLink to={createPageUrl("AdminCourseManagement")} icon={<BookOpen />} title="ניהול קורסים" subtitle="עריכה והוספה" color="info" />
                    <AdminQuickLink to={createPageUrl("AdminStudentManagement")} icon={<Users />} title="ניהול סטודנטים" subtitle="עריכה והוספה" color="success" />
                    <AdminQuickLink to={createPageUrl("AdminLecturerManagement")} icon={<Briefcase />} title="ניהול מרצים" subtitle="עריכה והוספה" color="secondary" />
                    <AdminQuickLink to={createPageUrl("AdminFileManagement")} icon={<FileCog />} title="ניהול קבצים" subtitle="צפייה וסינון" color="warning" />
                </Grid>
            ) : (
                <Grid container spacing={2}>
                    <StatCard to={createPageUrl("Notifications")} icon={<Heart />} value={stats.totalDownloads} title="הורדות" subtitle="לקבצים שלך" color="error" />
                    <StatCard to={createPageUrl("MyFiles")} icon={<FileText />} value={stats.totalFiles} title="קבצים" subtitle="שהעלת" color="info" />
                    <StatCard to={createPageUrl("MyFiles?status=approved")} icon={<CheckCircle />} value={stats.approvedFiles} title="קבצים" subtitle="מאושרים" color="success" />
                    <StatCard to={createPageUrl(user?.current_role === 'student' ? "MyFiles?status=pending" : "LecturerPendingFiles")} icon={<Clock />} value={stats.pendingFiles} title={user?.current_role === 'student' ? 'ממתינה' : 'ממתינים'} subtitle={user?.current_role === 'student' ? 'לבדיקה' : 'לאישורך'} color="warning" />
                    <StatCard to={createPageUrl("MyFiles?status=rejected")} icon={<XCircle />} value={stats.rejectedFiles} title="קבצים" subtitle="שנדחו" color="error" />
                </Grid>
            )}

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, lg: 4 }}>
                     <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: { lg: '400px' } }}>
                        <CardHeader 
                                title="פעילויות אחרונות"
                                sx={{ pb: 1 }}
                                
                                titleTypographyProps={{
                                    align: 'left',
                                    textAlign: 'left',
                                    variant: 'h6',
                                    fontWeight: 'bold'
                                }}
                        />
                        <CardContent sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
                            {recentFiles.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {recentFiles.slice(0, 2).map((notification) => (
                                        <Paper key={notification.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: !notification.is_read ? 'primary.light' : 'transparent' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar variant="rounded" sx={{
                                                    bgcolor: notification.type === 'file_approved' ? 'success.light' :
                                                              notification.type === 'file_rejected' ? 'error.light' :
                                                              notification.type === 'file_uploaded' ? 'info.light' : 'grey.200',
                                                    width: 24,
                                                    height: 24
                                                }}>
                                                    {notification.type === 'file_approved' && <CheckCircle sx={{ fontSize: 16 }} color="success" />}
                                                    {notification.type === 'file_rejected' && <XCircle sx={{ fontSize: 16 }} color="error" />}
                                                    {notification.type === 'file_uploaded' && <Upload sx={{ fontSize: 16 }} color="info" />}
                                                     {!['file_approved', 'file_rejected', 'file_uploaded'].includes(notification.type) && <FileText sx={{ fontSize: 16 }} />}
                                                </Avatar>
                                                <Box>
                                                     <Typography variant="caption" fontWeight="medium">{notification.title}</Typography>
                                                     <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                                        {notification.created_date && !isNaN(new Date(notification.created_date).getTime()) 
                                                      ? format(new Date(notification.created_date), 'd בMMM', { locale: he })
                                                      : 'תאריך לא תקין'
                                                    }
                                                    </Typography>
                                                </Box>
                                            </Box>
                                             {!notification.is_read && <Chip label="חדש" color="primary" size="small" sx={{ fontSize: '0.6rem', height: 16 }} />}
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <FileText sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                                    <Typography variant="body2" sx={{ textAlign: 'center' }}>אין פעילות אחרונה</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>התחל להעלות קבצים</Typography>
                                </Box>
                            )}
                        </CardContent>
                        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                            <Button component={Link} to={createPageUrl("Notifications")} fullWidth variant="outlined" size="small">הצג הכל</Button>
                        </Box>
                    </Card>
                </Grid>

                 <Grid size={{ xs: 12, lg: 4 }}>
                    <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: { lg: '400px' } }}>
                        <CardHeader
                            title="פניות אחרונות"
                            sx={{ pb: 1 }}
                            titleTypographyProps={{
                                align: 'left',
                                textAlign: 'left',
                                variant: 'h6',
                                fontWeight: 'bold'
                            }}
                            action={
                                <IconButton component={Link} to={createPageUrl("TrackInquiries?new=true")} size="small">
                                    <Plus size={16} />
                                </IconButton>
                            }
                        />
                        <CardContent sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
                           {recentInquiries.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {recentInquiries.slice(0, 2).map((inquiry) => (
                                        <Paper key={inquiry.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                 <Avatar variant="rounded" sx={{ bgcolor: 'grey.200', width: 24, height: 24 }}>
                                                      <MessageSquare size={16} />
                                                 </Avatar>
                                                <Box>
                                                    <Typography variant="caption" fontWeight="medium" noWrap sx={{ maxWidth: 120 }}>{inquiry.subject}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                                        {inquiry.created_date && !isNaN(new Date(inquiry.created_date).getTime()) 
                                                          ? format(new Date(inquiry.created_date), 'd בMMM', { locale: he })
                                                          : 'תאריך לא תקין'
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ transform: 'scale(0.8)' }}>{getInquiryStatusBadge(inquiry.status)}</Box>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                                                 <Box sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                     <MessageSquare size={32} style={{ color: 'grey' }} />
                                     <Typography variant="body2" sx={{ textAlign: 'center' }}>אין פניות</Typography>
                                     <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>שלח פנייה חדשה</Typography>
                                 </Box>
                            )}
                        </CardContent>
                         <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
                            <Button component={Link} to={createPageUrl("TrackInquiries")} fullWidth variant="outlined" size="medium">הצג הכל</Button>
                        </Box>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', maxHeight: { lg: '400px' } }}>
                        <Card elevation={2} sx={{ flex: 1.35 }}>
                            <CardHeader 
                                    title="פעולות מהירות"
                                    sx={{ pb: 0 }}
                                    titleTypographyProps={{
                                        align: 'left',
                                        textAlign: 'left',
                                        variant: 'h6',
                                        fontWeight: 'bold'
                                    }}
                            />
                            <CardContent>
                                <Grid container spacing={1.5}>
                                    <Grid size={12}>
                                        <Button component={Link} to={createPageUrl("UploadFile")} fullWidth variant="contained" startIcon={<Upload />}>העלאת קובץ חדש</Button>
                                    </Grid>
                                    <Grid size={12}>
                                        <Button component={Link} to={createPageUrl("Courses")} fullWidth variant="outlined" startIcon={<BookOpen />}>עיון בקורסים</Button>
                                    </Grid>
                                    <Grid size={12}>
                                        <Button component={Link} to={createPageUrl("MyFiles")} fullWidth variant="outlined" startIcon={<FileText />}>הקבצים שלי</Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                        <Card elevation={2} sx={{ flex: 1 }}>
                             <CardHeader 
                                title="ביצועים"
                                sx={{ pb: 0 }}
                                titleTypographyProps={{
                                    align: 'left',
                                    textAlign: 'left',
                                    variant: 'h6',
                                    fontWeight: 'bold'
                                }}
                            />
                             <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">קבצים שאושרו</Typography>
                                    <Typography variant="body2" fontWeight="medium">{stats.approvedFiles}/{stats.totalFiles}</Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={stats.totalFiles > 0 ? (stats.approvedFiles / stats.totalFiles) * 100 : 0}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Box sx={{ mt: 1, textAlign: 'left' }}>
                                    <Button component={Link} to={createPageUrl("Insights")} size="small">צפייה בתובנות</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>
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