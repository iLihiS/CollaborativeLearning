import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserEntity, Course, File, Student, Lecturer, Message, Notification } from "@/api/entities";
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
    FileCog
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
};

const MORNING_START = 5;
const AFTERNOON_START = 12;
const EVENING_START = 18;
const NIGHT_START = 22;

export default function Dashboard() {
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

        loadDashboardData();
    }, []);

    useEffect(() => {
        // Check for role change message after page reload
        const roleChangeMessage = sessionStorage.getItem('roleChangeMessage');
        if (roleChangeMessage) {
            setToast({ open: true, message: roleChangeMessage });
            sessionStorage.removeItem('roleChangeMessage');
        }
    }, []);

    const loadDashboardData = async () => {
        try {
            const currentUser = await UserEntity.me();
            setUser(currentUser);

            let roles = currentUser.roles || [];
            if (roles.length === 0) {
                const [studentRecords, lecturerRecords] = await Promise.all([
                    Student.filter({ email: currentUser.email }),
                    Lecturer.filter({ email: currentUser.email }),
                ]);
                if (studentRecords.length > 0) roles.push('student');
                if (lecturerRecords.length > 0) roles.push('lecturer');
                if (currentUser.email.includes('admin')) roles.push('admin');
            }
            setUserRoles(roles);

            let studentRecord = null;
            if (roles.includes('student')) {
                const studentRecords = await Student.filter({ email: currentUser.email });
                if (studentRecords.length > 0) {
                    studentRecord = studentRecords[0];
                } else {
                    // Only create if no student record exists for this email
                    studentRecord = await Student.create({
                        full_name: currentUser.full_name,
                        student_id: currentUser.student_id || `STU${Date.now()}`,
                        email: currentUser.email,
                        academic_track: currentUser.academic_track || "לא שויך מסלול",
                        academic_track_ids: currentUser.academic_track_ids || [],
                        year: 1,
                        status: 'active'
                    });
                }
            }

            let lecturerRecords = [];
            if (roles.includes('lecturer')) {
                lecturerRecords = await Lecturer.filter({ email: currentUser.email });
                if (lecturerRecords.length === 0) {
                    lecturerRecords.push(await Lecturer.create({
                        full_name: currentUser.full_name,
                        email: currentUser.email,
                        assigned_courses: [],
                        semester_start: "סמסטר א' תשפ\"ה",
                        department: currentUser.department || "מדעי המחשב"
                    }));
                }
            }

            if (!currentUser.current_role) {
                const defaultRole = roles.includes('student') ? 'student' :
                    roles.includes('lecturer') ? 'lecturer' : 'admin';
                const updatedUser = await UserEntity.updateMyUserData({ current_role: defaultRole });
                setUser(updatedUser);
            }

            if (currentUser.current_role !== 'admin') {
                const [userFiles, userInquiries, userNotifications, allFiles, allCourses] = await Promise.all([
                    File.filter({ uploader_id: studentRecord?.student_id }),
                    Message.filter({ sender_email: currentUser.email, sortBy: '-created_date' }),
                    Notification.filter({ user_email: currentUser.email, sortBy: '-created_date', limit: 5 }),
                    File.filter({ status: 'pending' }),
                    Course.list()
                ]);

                const totalDownloads = userFiles.reduce((sum: number, file: any) => sum + (file.download_count || 0), 0);

                let pendingFilesForLecturer = 0;
                if (currentUser.current_role === 'lecturer' && lecturerRecords.length > 0) {
                    const lecturerCourseIds = allCourses
                        .filter((c: any) => c.lecturer_id === lecturerRecords[0].id)
                        .map((c: any) => c.id);
                    pendingFilesForLecturer = allFiles.filter((f: any) => lecturerCourseIds.includes(f.course_id)).length;
                }

                setRecentFiles(userNotifications);
                setRecentInquiries(userInquiries.slice(0, 3));

                setStats({
                    totalFiles: userFiles.length,
                    approvedFiles: userFiles.filter((f: any) => f.status === 'approved').length,
                    pendingFiles: currentUser.current_role === 'student' ? userFiles.filter((f: any) => f.status === 'pending').length : pendingFilesForLecturer,
                    rejectedFiles: userFiles.filter((f: any) => f.status === 'rejected').length,
                    totalDownloads: totalDownloads
                });
            }
        } catch (error: any) {
            console.error("Error loading dashboard data:", error);
            if (error.message?.includes('not authenticated')) {
                await UserEntity.login('', '');
            }
        }
        setLoading(false);
    };

    const switchRole = async (newRole: string) => {
        handleClose();
        try {
            await UserEntity.updateMyUserData({ current_role: newRole });
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
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <Paper component={Link} to={to} elevation={0} sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, 
                    transition: 'all 0.2s', 
                    border: 1, 
                    borderColor: 'divider' 
                }}>
                    <Avatar sx={{ bgcolor: colorConfig.bg, color: colorConfig.color, mx: 'auto', mb: 1 }}>
                        {icon}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold" sx={{ textAlign: 'center' }}>{value}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{subtitle}</Typography>
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
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                <Paper component={Link} to={to} elevation={0} sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, 
                    transition: 'all 0.2s', 
                    border: 1, 
                    borderColor: 'divider' 
                }}>
                    <Avatar sx={{ bgcolor: colorConfig.bg, color: colorConfig.color, mx: 'auto', mb: 1 }}>
                        {icon}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold" sx={{ textAlign: 'center' }}>ניהול</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{subtitle}</Typography>
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
        <Box sx={{ p: { xs: 2, lg: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{
                borderRadius: '24px',
                p: { xs: 2, sm: 3, lg: 4 },
                mb: 4,
                color: 'white',
                background: 'linear-gradient(to right, #84cc16, #65a30d)',
                position: 'relative',
                overflow: 'hidden',
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)' }}>
                            <Typography variant="h5">{user?.full_name?.charAt(0) || 'L'}</Typography>
                        </Avatar>
                        <Box>
                            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {greeting.text} {greeting.icon}
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">{user?.full_name || 'משתמש'}</Typography>
                        </Box>
                    </Box>

                    {userRoles.length > 1 ? (
                        <>
                            <Button
                                id="role-button"
                                aria-controls={open ? 'role-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                onClick={handleClick}
                                variant="contained"
                                color="inherit"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'white', color: 'primary.main' } }}
                                startIcon={<GraduationCap />}
                                endIcon={<ChevronDown />}
                            >
                                {user?.current_role === 'lecturer' ? 'מרצה' : user?.current_role === 'admin' ? 'מנהל' : 'סטודנט'}
                            </Button>
                            <Menu
                                id="role-menu"
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                MenuListProps={{ 'aria-labelledby': 'role-button' }}
                            >
                                {userRoles.includes('student') && user?.current_role !== 'student' && (
                                    <MenuItem onClick={() => switchRole('student')}>מעבר לתצוגת סטודנט</MenuItem>
                                )}
                                {userRoles.includes('lecturer') && user?.current_role !== 'lecturer' && (
                                    <MenuItem onClick={() => switchRole('lecturer')}>מעבר לתצוגת מרצה</MenuItem>
                                )}
                                {userRoles.includes('admin') && user?.current_role !== 'admin' && (
                                    <MenuItem onClick={() => switchRole('admin')}>מעבר לתצוגת מנהל</MenuItem>
                                )}
                            </Menu>
                        </>
                    ) : (
                        <Button variant="contained" color="inherit" sx={{ cursor: 'default' }} startIcon={<GraduationCap />}>
                            {user?.current_role === 'lecturer' ? 'מרצה' : user?.current_role === 'admin' ? 'מנהל' : 'סטודנט'}
                        </Button>
                    )}
                </Box>
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box>
                        <Typography sx={{ mb: 2, display: { xs: 'none', sm: 'block' } }}>ברוכים הבאים לשיתוף האקדמי שלכם</Typography>
                        <Button component={Link} to={createPageUrl("UploadFile")} variant="contained" color="inherit" startIcon={<Upload />} sx={{ 
                            bgcolor: 'white', 
                            color: 'primary.main', 
                            border: '2px solid white',
                            '&:hover': { 
                                bgcolor: 'transparent', 
                                color: 'white',
                                borderColor: 'white'
                            } 
                        }}>
                            העלאת קובץ חדש
                        </Button>
                    </Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                     <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardHeader 
                                title="פעילויות אחרונות" 
                                titleTypographyProps={{
                                    align: 'left',
                                    textAlign: 'left'
                                }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                            {recentFiles.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {recentFiles.map((notification) => (
                                        <Paper key={notification.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: !notification.is_read ? 'primary.light' : 'transparent' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar variant="rounded" sx={{
                                                    bgcolor: notification.type === 'file_approved' ? 'success.light' :
                                                              notification.type === 'file_rejected' ? 'error.light' :
                                                              notification.type === 'file_uploaded' ? 'info.light' : 'grey.200'
                                                }}>
                                                    {notification.type === 'file_approved' && <CheckCircle color="success" />}
                                                    {notification.type === 'file_rejected' && <XCircle color="error" />}
                                                    {notification.type === 'file_uploaded' && <Upload color="info" />}
                                                     {!['file_approved', 'file_rejected', 'file_uploaded'].includes(notification.type) && <FileText />}
                                                </Avatar>
                                                <Box>
                                                     <Typography variant="body2" fontWeight="medium">{notification.title}</Typography>
                                                     <Typography variant="caption" color="text.secondary">
                                                        {format(new Date(notification.created_date), 'd בMMM yyyy', { locale: he })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                             {!notification.is_read && <Chip label="חדש" color="primary" size="small" />}
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <FileText sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
                                    <Typography variant="h6" sx={{ textAlign: 'center' }}>אין פעילות אחרונה</Typography>
                                    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>התחל להעלות קבצים כדי לראות פעילות כאן</Typography>
                                </Box>
                            )}
                        </CardContent>
                        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button component={Link} to={createPageUrl("Notifications")} fullWidth variant="outlined">הצג את כל הפעילויות</Button>
                        </Box>
                    </Card>
                </Grid>

                 <Grid size={{ xs: 12, lg: 4 }}>
                    <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardHeader
                            title="פניות אחרונות"
                            titleTypographyProps={{
                                align: 'left',
                                textAlign: 'left'
                            }}
                            action={
                                <IconButton component={Link} to={createPageUrl("TrackInquiries?new=true")} size="small">
                                    <Plus />
                                </IconButton>
                            }
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                           {recentInquiries.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {recentInquiries.map((inquiry) => (
                                        <Paper key={inquiry.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar variant="rounded" sx={{ bgcolor: 'grey.200' }}>
                                                     <MessageSquare />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 150 }}>{inquiry.subject}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {format(new Date(inquiry.created_date), 'd בMMM yyyy', { locale: he })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {getInquiryStatusBadge(inquiry.status)}
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <MessageSquare size={60} color="grey" />
                                    <Typography variant="h6" sx={{ textAlign: 'center' }}>אין פניות</Typography>
                                    <Typography color="text.secondary" sx={{ textAlign: 'center' }}>שלח פנייה חדשה למנהלי המערכת</Typography>
                                </Box>
                            )}
                        </CardContent>
                         <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Button component={Link} to={createPageUrl("TrackInquiries")} fullWidth variant="outlined">הצג את כל הפניות</Button>
                        </Box>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Card elevation={2}>
                            <CardHeader 
                                    title="פעולות מהירות"
                                    titleTypographyProps={{
                                        align: 'left',
                                        textAlign: 'left'
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
                        <Card elevation={2}>
                             <CardHeader 
                                title="ביצועים" 
                                titleTypographyProps={{
                                    align: 'left',
                                    textAlign: 'left'
                                }}
                            />
                             <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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