import { useState, useEffect } from 'react';
import { File as FileEntity, Course, Student, Lecturer, User } from '@/api/entities';
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Button, IconButton, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, TextareaAutosize,
    ToggleButtonGroup, ToggleButton, Chip
} from '@mui/material';
import { 
    Check, 
    X, 
    FileText, 
    CheckSquare, 
    Download,
    ChevronUp,
    ChevronDown,
    Filter,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type FileInfo = {
    id: string;
    filename: string;
    original_name: string;
    file_type: string;
    file_size: number;
    file_code?: string;
    course_id: string;
    uploader_id: string;
    uploader_type: 'student' | 'lecturer' | 'admin';
    status: 'pending' | 'approved' | 'rejected';
    approval_date?: string;
    approved_by?: string;
    rejection_reason?: string;
    download_count: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    file_url?: string;  // URL for externally linked files
};

type CourseInfo = {
    id: string;
    course_name?: string;
    name?: string;
    course_code?: string;
    code?: string;
};

type StudentInfo = {
    id: string;
    full_name: string;
};

export default function LecturerPendingFiles() {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<CourseInfo[]>([]);
    const [coursesMap, setCoursesMap] = useState<{ [key: string]: string }>({});
    const [studentsMap, setStudentsMap] = useState<{ [key: string]: string }>({});
    const [lecturersMap, setLecturersMap] = useState<{ [key: string]: string }>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [rejectingFile, setRejectingFile] = useState<FileInfo | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortField, setSortField] = useState<keyof FileInfo | ''>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<{
        filename: string;
        fileCode: string;
        course: string;
        fileType: string;
        uploader: string;
    }>({
        filename: '',
        fileCode: '',
        course: '',
        fileType: '',
        uploader: ''
    });

    useEffect(() => {
        loadData();
        setSortField('created_at');
        setSortDirection('desc');
    }, []);

    useEffect(() => {
        let filtered = files;
        
        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(file => file.uploader_type === roleFilter);
        }
        
        // Column filters
        if (filters.filename) {
            filtered = filtered.filter(file => 
                (file.original_name || file.filename || '').toLowerCase().includes(filters.filename.toLowerCase())
            );
        }
        
        if (filters.fileCode) {
            filtered = filtered.filter(file => 
                (file.file_code || '').toLowerCase().includes(filters.fileCode.toLowerCase())
            );
        }
        
        if (filters.course) {
            filtered = filtered.filter(file => 
                (coursesMap[file.course_id] || '').toLowerCase().includes(filters.course.toLowerCase())
            );
        }
        
        if (filters.fileType) {
            filtered = filtered.filter(file => 
                (file.file_type || '').toLowerCase().includes(filters.fileType.toLowerCase())
            );
        }
        
        if (filters.uploader) {
            filtered = filtered.filter(file => 
                (studentsMap[file.uploader_id] || lecturersMap[file.uploader_id] || '').toLowerCase().includes(filters.uploader.toLowerCase())
            );
        }
        
        // Sorting with multi-level fallback
        filtered.sort((a, b) => {
            // Primary sort
            if (sortField) {
                let aValue: any = '';
                let bValue: any = '';
                
                switch (sortField) {
                    case 'original_name':
                    case 'filename':
                        aValue = a.original_name || a.filename || '';
                        bValue = b.original_name || b.filename || '';
                        break;
                    case 'file_code':
                        aValue = a.file_code || '';
                        bValue = b.file_code || '';
                        break;
                    case 'file_type':
                        aValue = a.file_type || '';
                        bValue = b.file_type || '';
                        break;
                    case 'created_at':
                        aValue = new Date(a.created_at);
                        bValue = new Date(b.created_at);
                        break;
                    case 'download_count':
                        aValue = a.download_count || 0;
                        bValue = b.download_count || 0;
                        break;
                    case 'course_id':
                        aValue = coursesMap[a.course_id] || '';
                        bValue = coursesMap[b.course_id] || '';
                        break;
                    case 'uploader_type':
                        aValue = a.uploader_type;
                        bValue = b.uploader_type;
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
            const aDate = new Date(a.created_at);
            const bDate = new Date(b.created_at);
            if (aDate !== bDate) {
                return bDate.getTime() - aDate.getTime();
            }
            
            // Tertiary sort: Course name (alphabetical)
            const aCourse = coursesMap[a.course_id] || '';
            const bCourse = coursesMap[b.course_id] || '';
            if (aCourse !== bCourse) {
                return aCourse.localeCompare(bCourse, 'he');
            }
            
            // Quaternary sort: File name (alphabetical)
            const aFile = a.original_name || a.filename || '';
            const bFile = b.original_name || b.filename || '';
            return aFile.localeCompare(bFile, 'he');
        });
        
        setFilteredFiles(filtered);
    }, [files, roleFilter, filters, sortField, sortDirection, coursesMap, studentsMap, lecturersMap]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            const [fileList, courseList, studentList, lecturerList] = await Promise.all([
                FileEntity.filter({ status: 'pending' }),
                Course.list(),
                Student.list(),
                Lecturer.list()
            ]);

            // Filter files for lecturer's courses only
            const lecturerRecord = await Lecturer.filter({ user_id: user.id });
            let lecturerCourseIds: string[] = [];
            
            if (lecturerRecord.length > 0) {
                const allCourses = Array.isArray(courseList) ? courseList : [];
                lecturerCourseIds = allCourses
                    .filter((course: any) => course.lecturer_id === lecturerRecord[0].id)
                    .map((course: any) => course.id);
            }

            const lecturerFiles = Array.isArray(fileList) ? 
                fileList.filter((file: FileInfo) => lecturerCourseIds.includes(file.course_id)) : [];

            setFiles(lecturerFiles);
            setFilteredFiles(lecturerFiles);

            const validCourses = Array.isArray(courseList) ? courseList : [];
            setCourses(validCourses);

            const cMap = validCourses.reduce((acc: { [key: string]: string }, c: CourseInfo) => {
                if (c) acc[c.id] = c.course_name || c.name || 'קורס לא ידוע';
                return acc;
            }, {});
            setCoursesMap(cMap);

            const sMap = (Array.isArray(studentList) ? studentList : []).reduce((acc: { [key: string]: string }, s: StudentInfo) => {
                if (s) acc[s.id] = s.full_name;
                return acc;
            }, {});
            setStudentsMap(sMap);

            const lMap = (Array.isArray(lecturerList) ? lecturerList : []).reduce((acc: { [key: string]: string }, l: any) => {
                if (l) acc[l.id] = l.full_name || l.name || 'מרצה לא ידוע';
                return acc;
            }, {});
            setLecturersMap(lMap);
        } catch (error) {
            console.error('Error loading data:', error);
            setFiles([]);
            setFilteredFiles([]);
            setCourses([]);
            setCoursesMap({});
            setStudentsMap({});
            setLecturersMap({});
        }
        setLoading(false);
    };

    const handleRoleChange = (event: any, newRole: string) => {
        if (newRole !== null) {
            setRoleFilter(newRole);
        }
    };

    const handleSort = (field: keyof FileInfo) => {
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
            filename: '',
            fileCode: '',
            course: '',
            fileType: '',
            uploader: ''
        });
        setRoleFilter('all');
        setSortField('created_at');
        setSortDirection('desc');
    };

    const handleFileDownload = async (file: FileInfo) => {
        try {
            // Update download count
            await FileEntity.update(file.id, { 
                download_count: (file.download_count || 0) + 1 
            });
            
            // Refresh the files list to show updated count
            loadData();
            
            if (file.file_url) {
                // If it's an external link, open it in a new tab
                window.open(file.file_url, '_blank');
            } else {
                // If it's an uploaded file, attempt to download it
                // For now, we'll just open a placeholder link
                // In a real implementation, this would be the actual download URL
                window.open('#', '_blank');
            }
        } catch (error) {
            console.error('Error updating download count:', error);
            // Still open the file even if count update fails
            if (file.file_url) {
                window.open(file.file_url, '_blank');
            } else {
                window.open('#', '_blank');
            }
        }
    };

    const getSortIcon = (field: keyof FileInfo) => {
        if (sortField === field) {
            return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
        }
        return <ChevronUp size={16} style={{ opacity: 0.3 }} />;
    };

    const getRoleComponent = (uploaderType: string) => {
        const config = {
            student: { icon: CheckSquare, color: '#2196f3', label: 'סטודנט' },
            lecturer: { icon: CheckCircle, color: '#4caf50', label: 'מרצה' },
            admin: { icon: XCircle, color: '#ff9800', label: 'מנהל' }
        };
        
        const roleConfig = config[uploaderType as keyof typeof config];
        if (!roleConfig) return <Chip label="לא ידוע" size="small" />;
        
        const IconComponent = roleConfig.icon;
        return (
            <Chip
                icon={<IconComponent size={14} />}
                label={roleConfig.label}
                size="small"
                sx={{ 
                    bgcolor: `${roleConfig.color}20`,
                    color: roleConfig.color,
                    '& .MuiChip-icon': { color: roleConfig.color }
                }}
            />
        );
    };

    const handleApprove = async (fileId: string) => {
        try {
            await FileEntity.update(fileId, { 
                status: 'approved',
                approved_by: currentUser.id,
                approval_date: new Date().toISOString()
            });
            loadData();
        } catch (error) {
            console.error('Error approving file:', error);
            alert('שגיאה באישור הקובץ.');
        }
    };

    const handleReject = async () => {
        if (!rejectingFile || !rejectionReason.trim()) return;
        
        try {
            await FileEntity.update(rejectingFile.id, { 
                status: 'rejected',
                rejection_reason: rejectionReason,
                approved_by: currentUser.id,
                approval_date: new Date().toISOString()
            });
            setRejectingFile(null);
            setRejectionReason('');
            loadData();
        } catch (error) {
            console.error('Error rejecting file:', error);
            alert('שגיאה בדחיית הקובץ.');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <Clock />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold" textAlign="left">
                        קבצים ממתינים לאישור
                    </Typography>
                    <Typography color="text.secondary" textAlign="left">
                        ניהול ואישור קבצים שהועלו על ידי סטודנטים
                    </Typography>
                </Box>
            </Box>

            {/* Role Filter */}
            <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                    value={roleFilter}
                    exclusive
                    onChange={handleRoleChange}
                    aria-label="סינון לפי תפקיד"
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
                    <ToggleButton value="student" aria-label="סטודנטים">
                        סטודנטים
                    </ToggleButton>
                    <ToggleButton value="lecturer" aria-label="מרצים">
                        מרצים
                    </ToggleButton>
                    <ToggleButton value="admin" aria-label="מנהלים">
                        מנהלים
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            {/* Filter Row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                    <TextField
                        size="small"
                        placeholder="חפש קובץ..."
                        value={filters.filename}
                        onChange={(e) => handleFilterChange('filename', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש מספר קובץ..."
                        value={filters.fileCode}
                        onChange={(e) => handleFilterChange('fileCode', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש קורס..."
                        value={filters.course}
                        onChange={(e) => handleFilterChange('course', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש סוג..."
                        value={filters.fileType}
                        onChange={(e) => handleFilterChange('fileType', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 120 }}
                    />
                    <TextField
                        size="small"
                        placeholder="חפש מעלה..."
                        value={filters.uploader}
                        onChange={(e) => handleFilterChange('uploader', e.target.value)}
                        InputProps={{
                            startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
                        }}
                        sx={{ minWidth: 150 }}
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
                                        onClick={() => handleSort('original_name')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('original_name')}
                                    >
                                        שם קובץ
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('file_code')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('file_code')}
                                    >
                                        מספר קובץ
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('course_id')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('course_id')}
                                    >
                                        קורס
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('file_type')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('file_type')}
                                    >
                                        סוג
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('created_at')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('created_at')}
                                    >
                                        תאריך העלאה
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('uploader_id')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('uploader_id')}
                                    >
                                        מעלה
                                    </Button>
                                </TableCell>
                                <TableCell align="left">
                                    <Button
                                        onClick={() => handleSort('uploader_type')}
                                        sx={{ 
                                            color: 'inherit', 
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            minWidth: 'auto',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent' }
                                        }}
                                        endIcon={getSortIcon('uploader_type')}
                                    >
                                        תפקיד
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
                            ) : (Array.isArray(filteredFiles) ? filteredFiles : []).map((file) => (
                                <TableRow key={file.id} hover>
                                    <TableCell align="left">{file.original_name || file.filename || 'לא מוגדר'}</TableCell>
                                    <TableCell align="left">
                                        <Chip 
                                            label={file.file_code || 'לא הוגדר'} 
                                            size="small" 
                                            icon={<FileText color="#2e7d32" size={16} />}
                                            sx={{ bgcolor: file.file_code ? '#e8f5e8' : '#ffebee', color: file.file_code ? '#2e7d32' : '#d32f2f', width: "120px" }}
                                        />
                                    </TableCell>
                                    <TableCell align="left">{coursesMap[file.course_id] || 'קורס לא ידוע'}</TableCell>
                                    <TableCell align="left">{file.file_type || 'לא ידוע'}</TableCell>
                                    <TableCell>
                                        {file.created_at && !isNaN(new Date(file.created_at).getTime()) ? 
                                            format(new Date(file.created_at), 'd MMM yyyy', { locale: he }) : 
                                            'תאריך לא ידוע'
                                        }
                                    </TableCell>
                                    <TableCell align="left">
                                        {studentsMap[file.uploader_id] || lecturersMap[file.uploader_id] || 'מעלה לא ידוע'}
                                    </TableCell>
                                    <TableCell align="left">{getRoleComponent(file.uploader_type)}</TableCell>
                                    <TableCell align="left">
                                        <IconButton onClick={() => handleApprove(file.id)} color="success">
                                            <Check />
                                        </IconButton>
                                        <IconButton onClick={() => setRejectingFile(file)} color="error">
                                            <X />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleFileDownload(file)}
                                            title={file.file_url ? 'פתח קישור' : 'הורד קובץ'}
                                        >
                                            <Download />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Rejection Dialog */}
            <Dialog open={!!rejectingFile} onClose={() => setRejectingFile(null)} maxWidth="sm" fullWidth>
                <DialogTitle>דחיית קובץ</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        אנא הסבירו מדוע הקובץ נדחה:
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="סיבת הדחייה..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectingFile(null)}>ביטול</Button>
                    <Button 
                        onClick={handleReject} 
                        variant="contained" 
                        color="error"
                        disabled={!rejectionReason.trim()}
                    >
                        דחה קובץ
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
