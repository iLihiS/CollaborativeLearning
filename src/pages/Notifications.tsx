import { useState, useEffect } from "react";
import { Notification as NotificationEntity, User } from "@/api/entities";
import {
    Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableHead,
    TableRow, TableContainer, Box, Typography, Paper, CircularProgress,
    ToggleButtonGroup, ToggleButton, Avatar, TextField
} from '@mui/material';
import { 
    Bell, 
    BellOff, 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Upload, 
    Eye,
    ChevronUp,
    ChevronDown,
    Filter,
    X,
    FileText,
    AlertCircle,
    Info
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";

type NotificationInfo = {
    id: string;
    title: string;
    message: string;
    type: 'file_uploaded' | 'file_approved' | 'file_rejected' | 'inquiry_responded' | 'system' | 'course' | 'other';
    is_read: boolean;
    created_date: string;
    user_id: string;
    action_url?: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
};

const notificationTypeConfig = {
    file_uploaded: { icon: Upload, color: "#2196f3", label: "העלאת קובץ" },
    file_approved: { icon: CheckCircle, color: "#4caf50", label: "אישור קובץ" },
    file_rejected: { icon: XCircle, color: "#f44336", label: "דחיית קובץ" },
    inquiry_responded: { icon: MessageSquare, color: "#9c27b0", label: "מענה לפנייה" },
    system: { icon: AlertCircle, color: "#ff9800", label: "מערכת" },
    course: { icon: FileText, color: "#00bcd4", label: "קורס" },
    other: { icon: Info, color: "#607d8b", label: "אחר" }
};

const priorityConfig = {
    low: { color: "#4caf50", label: "נמוכה" },
    medium: { color: "#ff9800", label: "בינונית" },
    high: { color: "#f44336", label: "גבוהה" }
};

export default function Notifications() {
    const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<NotificationInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [readFilter, setReadFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortField, setSortField] = useState<keyof NotificationInfo | ''>('created_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<{
        title: string;
        message: string;
        category: string;
    }>({
        title: '',
        message: '',
        category: ''
    });

    useEffect(() => {
        loadNotifications();
        setSortField('created_date');
        setSortDirection('desc');
    }, []);

    useEffect(() => {
        let filtered = notifications;
        
        // Read status filter
        if (readFilter !== 'all') {
            filtered = filtered.filter(notification => 
                readFilter === 'unread' ? !notification.is_read : notification.is_read
            );
        }
        
        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(notification => notification.type === typeFilter);
        }
        
        // Column filters
        if (filters.title) {
            filtered = filtered.filter(notification => 
                (notification.title || '').toLowerCase().includes(filters.title.toLowerCase())
            );
        }
        
        if (filters.message) {
            filtered = filtered.filter(notification => 
                (notification.message || '').toLowerCase().includes(filters.message.toLowerCase())
            );
        }
        
        if (filters.category) {
            filtered = filtered.filter(notification => 
                (notification.category || '').toLowerCase().includes(filters.category.toLowerCase())
            );
        }
        
        // Sorting with multi-level fallback
        filtered.sort((a, b) => {
            // Primary sort
            if (sortField) {
                let aValue: any = '';
                let bValue: any = '';
                
                switch (sortField) {
                    case 'title':
                        aValue = a.title || '';
                        bValue = b.title || '';
                        break;
                    case 'message':
                        aValue = a.message || '';
                        bValue = b.message || '';
                        break;
                    case 'type':
                        aValue = notificationTypeConfig[a.type]?.label || '';
                        bValue = notificationTypeConfig[b.type]?.label || '';
                        break;
                    case 'created_date':
                        aValue = new Date(a.created_date);
                        bValue = new Date(b.created_date);
                        break;
                    case 'is_read':
                        aValue = a.is_read ? 1 : 0;
                        bValue = b.is_read ? 1 : 0;
                        break;
                    case 'priority':
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        aValue = priorityOrder[a.priority] || 1;
                        bValue = priorityOrder[b.priority] || 1;
                        break;
                    case 'category':
                        aValue = a.category || '';
                        bValue = b.category || '';
                        break;
                    default:
                        aValue = '';
                        bValue = '';
                }
                
                if (aValue < bValue) {
                    return sortDirection === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
            }
            
            // Secondary sort: Date (newest first)
            const aDate = new Date(a.created_date);
            const bDate = new Date(b.created_date);
            if (aDate !== bDate) {
                return bDate.getTime() - aDate.getTime();
            }
            
            // Tertiary sort: Title (alphabetical)
            return (a.title || '').localeCompare(b.title || '', 'he');
        });
        
        setFilteredNotifications(filtered);
    }, [notifications, readFilter, typeFilter, filters, sortField, sortDirection]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const currentUser = await User.me();
            let userNotifications = await NotificationEntity.filter({ user_id: currentUser.id });
            
            // If no notifications exist for this user, generate random ones
            if (!userNotifications || userNotifications.length === 0) {
                console.log('No notifications found for user, generating random notifications...');
                userNotifications = generateRandomNotifications(currentUser.id, 10);
                
                // Save the generated notifications
                for (const notification of userNotifications) {
                    await NotificationEntity.create(notification);
                }
            }
            
            // Transform to enhanced notification format
            const enhancedNotifications: NotificationInfo[] = (Array.isArray(userNotifications) ? userNotifications : []).map(notification => ({
                ...notification,
                priority: getPriorityFromType(notification.type),
                category: getCategoryFromType(notification.type)
            }));
            
            setNotifications(enhancedNotifications);
            setFilteredNotifications(enhancedNotifications);
        } catch (error) {
            console.error("Failed to load notifications:", error);
            setNotifications([]);
            setFilteredNotifications([]);
        }
        setLoading(false);
    };

    const getPriorityFromType = (type: string): 'low' | 'medium' | 'high' => {
        switch (type) {
            case 'file_rejected':
            case 'system':
                return 'high';
            case 'file_approved':
            case 'inquiry_responded':
                return 'medium';
            default:
                return 'low';
        }
    };

    const generateRandomNotifications = (userId: string, count: number): NotificationInfo[] => {
        const types: NotificationInfo['type'][] = ['file_uploaded', 'file_approved', 'file_rejected', 'inquiry_responded', 'system', 'course', 'other'];
        const titles = [
            'קובץ הועלה בהצלחה',
            'קובץ אושר על ידי המרצה',
            'קובץ נדחה',
            'תגובה לפנייה שלך',
            'עדכון מערכת',
            'עדכון בקורס',
            'הודעה כללית',
            'תזכורת חשובה',
            'הודעה מהמנהל',
            'עדכון בדיקות'
        ];
        const messages = [
            'הקובץ שלך הועלה למערכת ומחכה לאישור',
            'הקובץ שלך אושר ופורסם במערכת',
            'הקובץ שלך נדחה, אנא בדוק את הסיבה',
            'קיבלת תגובה לפנייה שהגשת',
            'המערכת עודכנה לגרסה חדשה',
            'יש עדכון חדש בקורס שלך',
            'הודעה כללית לכל המשתמשים',
            'תזכורת על משימה שטרם הושלמה',
            'הודעה חשובה מהמנהל',
            'נערכות בדיקות במערכת'
        ];

        return Array.from({ length: count }, (_, i) => {
            const type = types[Math.floor(Math.random() * types.length)];
            const title = titles[Math.floor(Math.random() * titles.length)];
            const message = messages[Math.floor(Math.random() * messages.length)];
            const daysAgo = Math.floor(Math.random() * 30);
            const createdDate = new Date();
            createdDate.setDate(createdDate.getDate() - daysAgo);

            return {
                id: `notification_${userId}_${Date.now()}_${i}`,
                title,
                message,
                type,
                is_read: Math.random() > 0.6, // 40% chance to be unread
                created_date: createdDate.toISOString(),
                user_id: userId,
                priority: getPriorityFromType(type),
                category: getCategoryFromType(type)
            };
        });
    };

    const getCategoryFromType = (type: string): string => {
        switch (type) {
            case 'file_uploaded':
            case 'file_approved':
            case 'file_rejected':
                return 'קבצים';
            case 'inquiry_responded':
                return 'פניות';
            case 'system':
                return 'מערכת';
            case 'course':
                return 'קורסים';
            default:
                return 'כללי';
        }
    };

    const handleReadStatusChange = (event: any, newStatus: string) => {
        if (newStatus !== null) {
            setReadFilter(newStatus);
        }
    };

    const handleTypeChange = (event: any, newType: string) => {
        if (newType !== null) {
            setTypeFilter(newType);
        }
    };

    const handleSort = (field: keyof NotificationInfo) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleFilterChange = (filterKey: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterKey]: value }));
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            message: '',
            category: ''
        });
        setReadFilter('all');
        setTypeFilter('all');
        setSortField('created_date');
        setSortDirection('desc');
    };

    const getSortIcon = (field: keyof NotificationInfo) => {
        if (sortField === field) {
            return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
        }
        return <ChevronUp size={16} style={{ opacity: 0.3 }} />;
    };

    const getTypeComponent = (type: string) => {
        const config = notificationTypeConfig[type as keyof typeof notificationTypeConfig];
        if (!config) return <Chip label="לא ידוע" size="small" />;
        
        const IconComponent = config.icon;
        return (
            <Chip
                icon={<IconComponent size={14} />}
                label={config.label}
                size="small"
                sx={{ 
                    bgcolor: `${config.color}20`,
                    color: config.color,
                    '& .MuiChip-icon': { color: config.color }
                }}
            />
        );
    };

    const getPriorityComponent = (priority: 'low' | 'medium' | 'high') => {
        const config = priorityConfig[priority];
        return (
            <Chip
                label={config.label}
                size="small"
                sx={{ 
                    bgcolor: `${config.color}20`,
                    color: config.color,
                    fontWeight: 500
                }}
            />
        );
    };

    const getReadStatusComponent = (isRead: boolean) => {
        return isRead ? (
            <Chip icon={<Eye size={14} />} label="נקרא" color="success" size="small" />
        ) : (
            <Chip icon={<Bell size={14} />} label="חדש" color="warning" size="small" />
        );
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await NotificationEntity.update(notificationId, { is_read: true });
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.is_read);
            await Promise.all(
                unreadNotifications.map(n => NotificationEntity.update(n.id, { is_read: true }))
            );
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <Bell />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" fontWeight="bold" textAlign="left">
                        התראות
                    </Typography>
                    <Typography color="text.secondary" textAlign="left">
                        צפייה וניהול התראות המערכת
                    </Typography>
                </Box>
                <Button
                    onClick={markAllAsRead}
                    variant="contained"
                    startIcon={<CheckCircle />}
                    sx={{ 
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    סמן הכל כנקרא
                </Button>
            </Box>

            {/* Read Status Filter */}
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={readFilter}
                    exclusive
                    onChange={handleReadStatusChange}
                    aria-label="סינון לפי סטטוס קריאה"
                    sx={{ 
                        gap: 1,
                        '& .MuiToggleButton-root': {
                            borderRadius: '12px',
                            border: '1px solid #d1d5db',
                            color: '#6b7280',
                            backgroundColor: '#f9fafb',
                            px: 3,
                            py: 0.5,
                            fontWeight: 500,
                            '&:hover': {
                                backgroundColor: '#f3f4f6',
                                borderColor: '#9ca3af'
                            },
                            '&.Mui-selected': {
                                backgroundColor: '#84cc16',
                                color: 'white',
                                borderColor: '#65a30d',
                                '&:hover': {
                                    backgroundColor: '#65a30d'
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value="all" aria-label="הכל">
                        הכל
                    </ToggleButton>
                    <ToggleButton value="unread" aria-label="לא נקרא">
                        לא נקרא
                    </ToggleButton>
                    <ToggleButton value="read" aria-label="נקרא">
                        נקרא
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Type Filter */}
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={typeFilter}
                    exclusive
                    onChange={handleTypeChange}
                    aria-label="סינון לפי סוג"
                    sx={{ 
                        gap: 1,
                        '& .MuiToggleButton-root': {
                            borderRadius: '12px',
                            border: '1px solid #d1d5db',
                            color: '#6b7280',
                            backgroundColor: '#f9fafb',
                            px: 2,
                            py: 0.5,
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            '&:hover': {
                                backgroundColor: '#f3f4f6',
                                borderColor: '#9ca3af'
                            },
                            '&.Mui-selected': {
                                backgroundColor: '#84cc16',
                                color: 'white',
                                borderColor: '#65a30d',
                                '&:hover': {
                                    backgroundColor: '#65a30d'
                                }
                            }
                        }
                    }}
                >
                    <ToggleButton value="all" aria-label="הכל">
                        הכל
                    </ToggleButton>
                    <ToggleButton value="file_uploaded" aria-label="העלאת קובץ">
                        העלאת קובץ
                    </ToggleButton>
                    <ToggleButton value="file_approved" aria-label="אישור קובץ">
                        אישור קובץ
                    </ToggleButton>
                    <ToggleButton value="file_rejected" aria-label="דחיית קובץ">
                        דחיית קובץ
                    </ToggleButton>
                    <ToggleButton value="inquiry_responded" aria-label="מענה לפנייה">
                        מענה לפנייה
                    </ToggleButton>
                    <ToggleButton value="system" aria-label="מערכת">
                        מערכת
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            {/* Filter Row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                    <TextField
                        size="small"
                        placeholder="חפש כותרת..."
                        value={filters.title}
                        onChange={(e) => handleFilterChange('title', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש הודעה..."
                        value={filters.message}
                        onChange={(e) => handleFilterChange('message', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש קטגוריה..."
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 120 }}
                    />
                </Box>
                
                <Button 
                    onClick={clearFilters} 
                    variant="outlined" 
                    size="small"
                    startIcon={<X />}
                    sx={{ 
                        minWidth: 'auto', 
                        height: '40px', 
                        flexShrink: 0,
                        borderColor: '#84cc16',
                        color: '#84cc16',
                        '&:hover': {
                            borderColor: '#65a30d',
                            backgroundColor: '#f0fdf4'
                        }
                    }}
                >
                    נקה סינונים
                </Button>
            </Box>

            <Paper elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('title')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('title')}
                                    >
                                        כותרת
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('message')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('message')}
                                    >
                                        הודעה
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('type')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('type')}
                                    >
                                        סוג
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('category')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('category')}
                                    >
                                        קטגוריה
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('priority')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('priority')}
                                    >
                                        עדיפות
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('created_date')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('created_date')}
                                    >
                                        תאריך
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('is_read')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('is_read')}
                                    >
                                        סטטוס
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        disabled
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            cursor: 'default',
                                            '&:hover': { bgcolor: 'transparent' },
                                            '&.Mui-disabled': {
                                                color: 'inherit',
                                                opacity: 1
                                            }
                                        }}
                                        endIcon={<ChevronUp size={16} style={{ opacity: 0.3 }} />}
                                    >
                                        פעולות
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center"><CircularProgress /></TableCell>
                                </TableRow>
                            ) : (Array.isArray(filteredNotifications) ? filteredNotifications : []).map((notification) => (
                                <TableRow key={notification.id} hover sx={{ bgcolor: !notification.is_read ? 'rgba(25, 118, 210, 0.04)' : 'inherit' }}>
                                    <TableCell align="left" sx={{ fontWeight: !notification.is_read ? 'bold' : 'normal' }}>
                                        {notification.title || 'ללא כותרת'}
                                    </TableCell>
                                    <TableCell align="left" sx={{ maxWidth: 300 }}>
                                        <Typography variant="body2" sx={{ 
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'left'

                                        }}>
                                            {notification.message || 'ללא הודעה'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="left">{getTypeComponent(notification.type)}</TableCell>
                                    <TableCell align="left">{notification.category || 'כללי'}</TableCell>
                                    <TableCell align="left">{getPriorityComponent(notification.priority)}</TableCell>
                                    <TableCell align="left">
                                        {notification.created_date && !isNaN(new Date(notification.created_date).getTime()) ? 
                                            format(new Date(notification.created_date), 'd MMM yyyy', { locale: he }) : 
                                            'תאריך לא ידוע'
                                        }
                                    </TableCell>
                                    <TableCell align="left">{getReadStatusComponent(notification.is_read)}</TableCell>
                                    <TableCell align="left">
                                        {!notification.is_read && (
                                            <Button
                                                size="small"
                                                onClick={() => markAsRead(notification.id)}
                                                startIcon={<Eye size={16} />}
                                                sx={{ minWidth: 'auto' }}
                                            >
                                                סמן כנקרא
                                            </Button>
                                        )}
                                        {notification.action_url && (
                                            <Button
                                                component={Link}
                                                to={notification.action_url}
                                                size="small"
                                                sx={{ ml: 1, minWidth: 'auto' }}
                                            >
                                                פתח
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
