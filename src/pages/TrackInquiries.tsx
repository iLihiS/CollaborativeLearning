
import { useState, useEffect } from 'react';
import { Message, User } from '@/api/entities';
import {
    Card, CardContent, CardHeader, Typography, Button, TextField, Chip, Alert,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogTitle, DialogContent, DialogActions, Box, Paper, Avatar,
    CircularProgress, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { 
    MessagesSquare, 
    Plus, 
    Send, 
    CheckCircle, 
    Clock, 
    Eye,
    ChevronUp,
    ChevronDown,
    Filter,
    X,
    MessageSquare,
    AlertCircle,
    User as UserIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type InquiryInfo = {
    id: string;
    subject: string;
    content: string;
    sender_name: string;
    sender_email: string;
    status: 'pending' | 'handled' | 'closed';
    priority: 'low' | 'medium' | 'high';
    category: string;
    created_date: string;
    updated_date?: string;
    admin_response?: string;
    response_date?: string;
};

type FormState = {
    subject: string;
    content: string;
    sender_name: string;
    sender_email: string;
};

type FormErrors = {
    subject?: string;
    content?: string;
    sender_name?: string;
    sender_email?: string;
};

const statusConfig = {
    pending: { color: "#ff9800", label: "ממתין" },
    handled: { color: "#4caf50", label: "טופל" },
    closed: { color: "#607d8b", label: "סגור" }
};

const priorityConfig = {
    low: { color: "#4caf50", label: "נמוכה" },
    medium: { color: "#ff9800", label: "בינונית" },
    high: { color: "#f44336", label: "גבוהה" }
};

export default function TrackInquiries() {
    const [user, setUser] = useState<any>(null);
    const [inquiries, setInquiries] = useState<InquiryInfo[]>([]);
    const [filteredInquiries, setFilteredInquiries] = useState<InquiryInfo[]>([]);
    const [showNewInquiry, setShowNewInquiry] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortField, setSortField] = useState<keyof InquiryInfo | ''>('created_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<{
        subject: string;
        content: string;
        category: string;
        sender: string;
    }>({
        subject: '',
        content: '',
        category: '',
        sender: ''
    });
    const [formData, setFormData] = useState<FormState>({
        subject: '',
        content: '',
        sender_name: '',
        sender_email: ''
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [selectedInquiry, setSelectedInquiry] = useState<InquiryInfo | null>(null);

    useEffect(() => {
        loadData();
        setSortField('created_date');
        setSortDirection('desc');
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('new') === 'true') {
            setShowNewInquiry(true);
        }
    }, []);

    useEffect(() => {
        let filtered = inquiries;
        
        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
        }
        
        // Priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(inquiry => inquiry.priority === priorityFilter);
        }
        
        // Column filters
        if (filters.subject) {
            filtered = filtered.filter(inquiry => 
                (inquiry.subject || '').toLowerCase().includes(filters.subject.toLowerCase())
            );
        }
        
        if (filters.content) {
            filtered = filtered.filter(inquiry => 
                (inquiry.content || '').toLowerCase().includes(filters.content.toLowerCase())
            );
        }
        
        if (filters.category) {
            filtered = filtered.filter(inquiry => 
                (inquiry.category || '').toLowerCase().includes(filters.category.toLowerCase())
            );
        }
        
        if (filters.sender) {
            filtered = filtered.filter(inquiry => 
                (inquiry.sender_name || '').toLowerCase().includes(filters.sender.toLowerCase()) ||
                (inquiry.sender_email || '').toLowerCase().includes(filters.sender.toLowerCase())
            );
        }
        
        // Sorting with multi-level fallback
        filtered.sort((a, b) => {
            // Primary sort
            if (sortField) {
                let aValue: any = '';
                let bValue: any = '';
                
                switch (sortField) {
                    case 'subject':
                        aValue = a.subject || '';
                        bValue = b.subject || '';
                        break;
                    case 'content':
                        aValue = a.content || '';
                        bValue = b.content || '';
                        break;
                    case 'sender_name':
                        aValue = a.sender_name || '';
                        bValue = b.sender_name || '';
                        break;
                    case 'status':
                        aValue = a.status;
                        bValue = b.status;
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
                    case 'created_date':
                        aValue = new Date(a.created_date);
                        bValue = new Date(b.created_date);
                        break;
                    case 'updated_date':
                        aValue = new Date(a.updated_date || a.created_date);
                        bValue = new Date(b.updated_date || b.created_date);
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
            
            // Tertiary sort: Subject (alphabetical)
            return (a.subject || '').localeCompare(b.subject || '', 'he');
        });
        
        setFilteredInquiries(filtered);
    }, [inquiries, statusFilter, priorityFilter, filters, sortField, sortDirection]);

    useEffect(() => {
        validateForm();
    }, [formData]);

    const loadData = async () => {
        setLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            
            const userInquiries = await Message.filter({ sender_email: currentUser.email });
            
            // Transform to enhanced inquiry format
            const enhancedInquiries: InquiryInfo[] = (Array.isArray(userInquiries) ? userInquiries : []).map(inquiry => ({
                ...inquiry,
                priority: getPriorityFromContent(inquiry.content),
                category: getCategoryFromSubject(inquiry.subject),
                updated_date: inquiry.response_date || inquiry.created_date
            }));
            
            setInquiries(enhancedInquiries);
            setFilteredInquiries(enhancedInquiries);
        } catch (error) {
            console.error('Error loading inquiries:', error);
            setInquiries([]);
            setFilteredInquiries([]);
        }
        setLoading(false);
    };

    const getPriorityFromContent = (content: string): 'low' | 'medium' | 'high' => {
        const urgentWords = ['דחוף', 'חשוב', 'מיידי', 'בעיה', 'שגיאה', 'לא עובד'];
        const mediumWords = ['בעיה', 'שאלה', 'עזרה', 'תמיכה'];
        
        const lowerContent = (content || '').toLowerCase();
        
        if (urgentWords.some(word => lowerContent.includes(word))) {
            return 'high';
        } else if (mediumWords.some(word => lowerContent.includes(word))) {
            return 'medium';
        }
        return 'low';
    };

    const getCategoryFromSubject = (subject: string): string => {
        const lowerSubject = (subject || '').toLowerCase();
        
        if (lowerSubject.includes('קובץ') || lowerSubject.includes('העלאה')) {
            return 'קבצים';
        } else if (lowerSubject.includes('קורס') || lowerSubject.includes('לימוד')) {
            return 'קורסים';
        } else if (lowerSubject.includes('טכני') || lowerSubject.includes('שגיאה') || lowerSubject.includes('בעיה')) {
            return 'תמיכה טכנית';
        } else if (lowerSubject.includes('חשבון') || lowerSubject.includes('משתמש')) {
            return 'חשבון משתמש';
        }
        return 'כללי';
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        
        if (!formData.subject.trim()) {
            newErrors.subject = 'נושא הפנייה הוא שדה חובה';
        }
        
        if (!formData.content.trim()) {
            newErrors.content = 'תוכן הפנייה הוא שדה חובה';
        }
        
        if (!formData.sender_name.trim()) {
            newErrors.sender_name = 'שם השולח הוא שדה חובה';
        }
        
        if (!formData.sender_email.trim()) {
            newErrors.sender_email = 'אימייל השולח הוא שדה חובה';
        } else if (!/\S+@\S+\.\S+/.test(formData.sender_email)) {
            newErrors.sender_email = 'כתובת אימייל לא תקינה';
        }
        
        setFormErrors(newErrors);
        setIsFormValid(Object.keys(newErrors).length === 0);
    };

    const handleStatusChange = (event: any, newStatus: string) => {
        if (newStatus !== null) {
            setStatusFilter(newStatus);
        }
    };

    const handlePriorityChange = (event: any, newPriority: string) => {
        if (newPriority !== null) {
            setPriorityFilter(newPriority);
        }
    };

    const handleSort = (field: keyof InquiryInfo) => {
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
            subject: '',
            content: '',
            category: '',
            sender: ''
        });
        setStatusFilter('all');
        setPriorityFilter('all');
        setSortField('created_date');
        setSortDirection('desc');
    };

    const getSortIcon = (field: keyof InquiryInfo) => {
        if (sortField === field) {
            return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
        }
        return <ChevronUp size={16} style={{ opacity: 0.3 }} />;
    };

    const getStatusComponent = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        if (!config) return <Chip label="לא ידוע" size="small" />;
        
        const icon = status === 'pending' ? Clock : status === 'handled' ? CheckCircle : AlertCircle;
        const IconComponent = icon;
        
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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid) {
            validateForm();
            return;
        }
        
        setSubmitting(true);
        try {
            const newInquiry = {
                ...formData,
                status: 'pending' as const,
                created_date: new Date().toISOString()
            };
            
            await Message.create(newInquiry);
            setSuccess(true);
            setFormData({ subject: '', content: '', sender_name: '', sender_email: '' });
            setFormErrors({});
            
            setTimeout(() => {
                setShowNewInquiry(false);
                setSuccess(false);
                loadData();
            }, 2000);
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            alert('שגיאה בשליחת הפנייה. אנא נסה שוב.');
        }
        setSubmitting(false);
    };

    const handleCancel = () => {
        setShowNewInquiry(false);
        setFormData({ subject: '', content: '', sender_name: '', sender_email: '' });
        setFormErrors({});
        setSuccess(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    מעקב פניות
                </Typography>
                <Button
                    onClick={() => setShowNewInquiry(true)}
                    variant="contained"
                    startIcon={<Plus />}
                    sx={{ 
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                    }}
                >
                    פנייה חדשה
                </Button>
            </Box>

            {/* Status Filter */}
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={statusFilter}
                    exclusive
                    onChange={handleStatusChange}
                    aria-label="סינון לפי סטטוס"
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
                    <ToggleButton value="pending" aria-label="ממתין">
                        ממתין
                    </ToggleButton>
                    <ToggleButton value="handled" aria-label="טופל">
                        טופל
                    </ToggleButton>
                    <ToggleButton value="closed" aria-label="סגור">
                        סגור
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Priority Filter */}
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={priorityFilter}
                    exclusive
                    onChange={handlePriorityChange}
                    aria-label="סינון לפי עדיפות"
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
                    <ToggleButton value="high" aria-label="עדיפות גבוהה">
                        עדיפות גבוהה
                    </ToggleButton>
                    <ToggleButton value="medium" aria-label="עדיפות בינונית">
                        עדיפות בינונית
                    </ToggleButton>
                    <ToggleButton value="low" aria-label="עדיפות נמוכה">
                        עדיפות נמוכה
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            {/* Filter Row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                    <TextField
                        size="small"
                        placeholder="חפש נושא..."
                        value={filters.subject}
                        onChange={(e) => handleFilterChange('subject', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש תוכן..."
                        value={filters.content}
                        onChange={(e) => handleFilterChange('content', e.target.value)}
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
                    <TextField
                        size="small"
                        placeholder="חפש שולח..."
                        value={filters.sender}
                        onChange={(e) => handleFilterChange('sender', e.target.value)}
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
                                        onClick={() => handleSort('subject')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('subject')}
                                    >
                                        נושא
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('content')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('content')}
                                    >
                                        תוכן
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
                                        onClick={() => handleSort('sender_name')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('sender_name')}
                                    >
                                        שולח
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
                                        תאריך יצירה
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('status')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('status')}
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
                            ) : (Array.isArray(filteredInquiries) ? filteredInquiries : []).map((inquiry) => (
                                <TableRow key={inquiry.id} hover>
                                    <TableCell align="left" sx={{ fontWeight: inquiry.status === 'pending' ? 'bold' : 'normal' }}>
                                        {inquiry.subject || 'ללא נושא'}
                                    </TableCell>
                                    <TableCell align="left" sx={{ maxWidth: 300 }}>
                                        <Typography variant="body2" sx={{ 
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {inquiry.content || 'ללא תוכן'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="left">{inquiry.category || 'כללי'}</TableCell>
                                    <TableCell align="left">{getPriorityComponent(inquiry.priority)}</TableCell>
                                    <TableCell align="left">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <UserIcon size={16} color="#6b7280" />
                                            <Typography variant="body2">
                                                {inquiry.sender_name || 'לא ידוע'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="left">
                                        {inquiry.created_date && !isNaN(new Date(inquiry.created_date).getTime()) ? 
                                            format(new Date(inquiry.created_date), 'd MMM yyyy', { locale: he }) : 
                                            'תאריך לא ידוע'
                                        }
                                    </TableCell>
                                    <TableCell align="left">{getStatusComponent(inquiry.status)}</TableCell>
                                    <TableCell align="left">
                                        <Button
                                            size="small"
                                            onClick={() => setSelectedInquiry(inquiry)}
                                            startIcon={<Eye size={16} />}
                                            sx={{ minWidth: 'auto' }}
                                        >
                                            צפייה
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* New Inquiry Dialog */}
            <Dialog open={showNewInquiry} onClose={handleCancel} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MessagesSquare />
                    פנייה חדשה
                </DialogTitle>
                <DialogContent>
                    {success ? (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            הפנייה נשלחה בהצלחה! נחזור אליך בהקדם.
                        </Alert>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                            <TextField
                                name="sender_name"
                                label="שם מלא"
                                value={formData.sender_name}
                                onChange={handleFormChange}
                                error={!!formErrors.sender_name}
                                helperText={formErrors.sender_name}
                                required
                                fullWidth
                            />
                            
                            <TextField
                                name="sender_email"
                                label="כתובת אימייל"
                                type="email"
                                value={formData.sender_email}
                                onChange={handleFormChange}
                                error={!!formErrors.sender_email}
                                helperText={formErrors.sender_email}
                                required
                                fullWidth
                            />
                            
                            <TextField
                                name="subject"
                                label="נושא הפנייה"
                                value={formData.subject}
                                onChange={handleFormChange}
                                error={!!formErrors.subject}
                                helperText={formErrors.subject}
                                required
                                fullWidth
                            />
                            
                            <TextField
                                name="content"
                                label="תוכן הפנייה"
                                value={formData.content}
                                onChange={handleFormChange}
                                error={!!formErrors.content}
                                helperText={formErrors.content}
                                required
                                multiline
                                rows={4}
                                fullWidth
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} disabled={submitting}>
                        ביטול
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!isFormValid || submitting || success}
                        startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                    >
                        {submitting ? 'שולח...' : 'שלח פנייה'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Inquiry Dialog */}
            <Dialog open={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} maxWidth="md" fullWidth>
                <DialogTitle>פרטי פנייה</DialogTitle>
                <DialogContent>
                    {selectedInquiry && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                            <Typography variant="h6">{selectedInquiry.subject}</Typography>
                            <Typography variant="body1">{selectedInquiry.content}</Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {getStatusComponent(selectedInquiry.status)}
                                {getPriorityComponent(selectedInquiry.priority)}
                                <Chip label={selectedInquiry.category} size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                נשלח על ידי: {selectedInquiry.sender_name} ({selectedInquiry.sender_email})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                תאריך: {format(new Date(selectedInquiry.created_date), 'd MMM yyyy HH:mm', { locale: he })}
                            </Typography>
                            {selectedInquiry.admin_response && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">תגובת המערכת:</Typography>
                                    <Typography variant="body2">{selectedInquiry.admin_response}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedInquiry(null)}>סגור</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
