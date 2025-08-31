
import { useState, useEffect, ChangeEvent } from 'react';
import { File as FileEntity, Course, Student, User, Lecturer } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, IconButton, CircularProgress, Chip, Avatar,
    ToggleButtonGroup, ToggleButton, TextField, Dialog, DialogTitle, 
    DialogContent, DialogActions, FormControl, InputLabel, Select, 
    MenuItem, Autocomplete
} from '@mui/material';
import { FileText, Trash2, Check, X, Download, Clock, ArrowRight, Plus, CloudUpload, User as UserIcon, GraduationCap, Shield, ChevronUp, ChevronDown, Filter, Lock, Unlock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

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

type LecturerInfo = {
  id: string;
  full_name: string;
  name?: string;
};

type FormData = {
  title: string;
  description: string;
  course_id: string;
  file_type: string;
  file_code: string;
};

type FormErrors = {
  title?: string;
  description?: string;
  course_id?: string;
  file_type?: string;
  file_code?: string;
  file?: string;
};

export default function MyFiles() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [coursesMap, setCoursesMap] = useState<{ [key: string]: string }>({});
  const [studentsMap, setStudentsMap] = useState<{ [key: string]: string }>({});
  const [lecturersMap, setLecturersMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof FileInfo | ''>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<{
    filename: string;
    fileCode: string;
    course: string;
    fileType: string;
  }>({
    filename: '',
    fileCode: '',
    course: '',
    fileType: ''
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    course_id: '',
    file_type: '',
    file_code: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isFileCodeEditable, setIsFileCodeEditable] = useState(false);

  useEffect(() => {
    loadData();
    setSortField('created_at');
    setSortDirection('desc');
  }, []);

  useEffect(() => {
    let filtered = files;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(file => file.status === statusFilter);
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
          case 'status':
            aValue = a.status;
            bValue = b.status;
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
      
      // Secondary sort: Course name (alphabetical)
      const aCourse = coursesMap[a.course_id] || '';
      const bCourse = coursesMap[b.course_id] || '';
      if (aCourse !== bCourse) {
        return aCourse.localeCompare(bCourse, 'he');
      }
      
      // Tertiary sort: File name (alphabetical)
      const aFile = a.original_name || a.filename || '';
      const bFile = b.original_name || b.filename || '';
      return aFile.localeCompare(bFile, 'he');
    });
    
    setFilteredFiles(filtered);
  }, [files, statusFilter, filters, sortField, sortDirection, coursesMap]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user to filter files
      const currentUser = await User.me();
      
      const [fileList, courseList, studentList, lecturerList] = await Promise.all([
        FileEntity.list(), 
        Course.list(), 
        Student.list(),
        Lecturer.list()
      ]);
      
      // Filter files for current user only
      const userFiles = Array.isArray(fileList) ? 
        fileList.filter((file: FileInfo) => file.uploader_id === currentUser.id) : [];
      
      setFiles(userFiles);
      setFilteredFiles(userFiles);

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

      const lMap = (Array.isArray(lecturerList) ? lecturerList : []).reduce((acc: { [key: string]: string }, l: LecturerInfo) => {
        if (l) acc[l.id] = l.full_name || l.name || 'מרצה לא ידוע';
        return acc;
      }, {});
      setLecturersMap(lMap);
    } catch (error) {
      console.error("Error loading data:", error);
      setFiles([]);
      setFilteredFiles([]);
      setCourses([]);
      setCoursesMap({});
      setStudentsMap({});
      setLecturersMap({});
    }
    setLoading(false);
  };
  
  const handleDelete = async (fileId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה?')) {
      try {
        await FileEntity.delete(fileId);
        loadData();
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert('שגיאה במחיקת הקובץ.');
      }
    }
  };

  const handleStatusChange = (event: any, newStatus: string) => {
    if (newStatus !== null) {
      setStatusFilter(newStatus);
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
      fileType: ''
    });
    setStatusFilter('all');
    setSortField('created_at');
    setSortDirection('desc');
  };

  const getSortIcon = (field: keyof FileInfo) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
    }
    return <ChevronUp size={16} style={{ opacity: 0.3 }} />;
  };

  const getStatusComponent = (status: string) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<Check size={14} />} label="מאושר" color="success" size="small" />;
      case 'pending':
        return <Chip icon={<Clock size={14} />} label="ממתין" color="warning" size="small" />;
      case 'rejected':
        return <Chip icon={<X size={14} />} label="נדחה" color="error" size="small" />;
      default:
        return <Chip label="לא ידוע" size="small" />;
    }
  };

  // Dialog functions
  const handleOpenDialog = () => {
    setDialogOpen(true);
    setFormData({
      title: '',
      description: '',
      course_id: '',
      file_type: '',
      file_code: ''
    });
    setFormErrors({});
    setSelectedFile(null);
    setHasAttemptedSubmit(false);
    setIsFileCodeEditable(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      course_id: '',
      file_type: '',
      file_code: ''
    });
    setFormErrors({});
    setSelectedFile(null);
    setHasAttemptedSubmit(false);
    setIsFileCodeEditable(false);
  };

  const generateFileCode = (courseId: string, fileType: string): string => {
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      return 'FILE-001';
    }
    
    const courseCode = course?.course_code || course?.code || course?.name?.substring(0, 4).toUpperCase() || 'FILE';
    
    const typePrefix = {
      'note': 'N',
      'exam': 'E', 
      'formulas': 'F',
      'assignment': 'A',
      'other': 'O'
    }[fileType] || 'O';
    
    // Find next available number for this course and type
    const existingCodes = files
      .filter(f => f.file_code && f.file_code.startsWith(`${courseCode}-${typePrefix}`))
      .map(f => {
        const match = f.file_code!.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      });
    
    const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    return `${courseCode}-${typePrefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  const isFileCodeUnique = (code: string): boolean => {
    return !files.some(f => f.file_code === code);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'שם הקובץ הוא שדה חובה';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'תיאור הקובץ הוא שדה חובה';
    }
    
    if (!formData.course_id) {
      newErrors.course_id = 'יש לבחור קורס';
    }
    
    if (!formData.file_type) {
      newErrors.file_type = 'יש לבחור סוג קובץ';
    }
    
    if (!formData.file_code.trim()) {
      newErrors.file_code = 'קוד קובץ הוא שדה חובה';
    } else if (!isFileCodeUnique(formData.file_code)) {
      newErrors.file_code = 'קוד קובץ זה כבר קיים במערכת';
    }
    
    if (!selectedFile) {
      newErrors.file = 'יש לבחור קובץ להעלאה';
    }
    
    setFormErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0 && 
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.course_id !== '' &&
      formData.file_type !== '' &&
      formData.file_code.trim() !== '' &&
      selectedFile !== null;
    
    setIsFormValid(isValid);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Reset attempt flag when user starts interacting with form
    if (hasAttemptedSubmit) {
      setHasAttemptedSubmit(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    
    if (file && !formData.title) {
      // Auto-fill title from filename
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
    }
    
    // Clear file error
    if (formErrors.file) {
      setFormErrors(prev => ({ ...prev, file: undefined }));
    }
    
    // Reset attempt flag when user starts interacting with form
    if (hasAttemptedSubmit) {
      setHasAttemptedSubmit(false);
    }
  };

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    
    if (!isFormValid) {
      validateForm();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get current user info for uploader details
      const currentUser = await User.me();
      let uploaderId = currentUser.id;
      let uploaderType: 'student' | 'lecturer' | 'admin' = 'student';
      
      // Determine uploader type based on current role
      if (currentUser.current_role === 'lecturer') {
        uploaderType = 'lecturer';
      } else if (currentUser.current_role === 'admin') {
        uploaderType = 'admin';
      }
      
      // Create file entity
      const fileData = {
        filename: selectedFile?.name || formData.title,
        original_name: formData.title,
        file_type: formData.file_type,
        file_code: formData.file_code,
        course_id: formData.course_id,
        uploader_id: uploaderId,
        uploader_type: uploaderType,
        status: uploaderType === 'student' ? 'pending' : 'approved', // Auto-approve for lecturers/admins
        file_size: selectedFile?.size || 0,
        download_count: 0,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await FileEntity.create(fileData);
      
      // Refresh the files list
      loadData();
      
      // Close dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('שגיאה בהעלאת הקובץ. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate file code when course and file type are selected
  useEffect(() => {
    if (formData.course_id && formData.file_type && !isFileCodeEditable && courses.length > 0) {
      const generatedCode = generateFileCode(formData.course_id, formData.file_type);
      setFormData(prev => ({ ...prev, file_code: generatedCode }));
    }
  }, [formData.course_id, formData.file_type, isFileCodeEditable, courses, files]);

  useEffect(() => {
    validateForm();
  }, [formData, selectedFile]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          הקבצים שלי
        </Typography>
        <Button
          onClick={handleOpenDialog}
          variant="contained"
          startIcon={<Plus />}
          sx={{ 
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          הוסף קובץ חדש
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
          <ToggleButton value="approved" aria-label="מאושר">
            מאושר
          </ToggleButton>
          <ToggleButton value="pending" aria-label="ממתין">
            ממתין לאישור
          </ToggleButton>
          <ToggleButton value="rejected" aria-label="נדחה">
            נדחה
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
                    onClick={() => handleSort('download_count')}
                    sx={{ 
                      color: 'inherit', 
                      fontWeight: 'bold',
                      textTransform: 'none',
                      minWidth: 'auto',
                      p: 0,
                      '&:hover': { bgcolor: 'transparent' }
                    }}
                    endIcon={getSortIcon('download_count')}
                  >
                    הורדות
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
                  <TableCell align="left">{file.download_count || 0}</TableCell>
                  <TableCell align="left">{getStatusComponent(file.status)}</TableCell>
                  <TableCell align="left">
                    <IconButton onClick={() => window.open('#', '_blank')}><Download /></IconButton>
                    <IconButton onClick={() => handleDelete(file.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add File Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Plus />  
          הוספת קובץ חדש
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              name="title"
              label="שם הקובץ"
              value={formData.title}
              onChange={handleFormChange}
              error={hasAttemptedSubmit && !!formErrors.title}
              helperText={hasAttemptedSubmit ? formErrors.title : ''}
              required
              fullWidth
            />
            
            <TextField
              name="description"
              label="תיאור הקובץ"
              value={formData.description}
              onChange={handleFormChange}
              error={hasAttemptedSubmit && !!formErrors.description}
              helperText={hasAttemptedSubmit ? formErrors.description : ''}
              required
              multiline
              rows={3}
              fullWidth
            />
            
            <Autocomplete
              options={courses}
              getOptionLabel={(option) => `${option.course_name || option.name} ${option.course_code ? `(${option.course_code})` : ''}`}
              value={courses.find(course => course.id === formData.course_id) || null}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, course_id: newValue?.id || '' }));
                if (formErrors.course_id) {
                  setFormErrors(prev => ({ ...prev, course_id: undefined }));
                }
                
                // Reset attempt flag when user starts interacting with form
                if (hasAttemptedSubmit) {
                  setHasAttemptedSubmit(false);
                }
                
                // Reset file code when course changes
                if (newValue?.id && formData.file_type && !isFileCodeEditable) {
                  const generatedCode = generateFileCode(newValue.id, formData.file_type);
                  setFormData(prev => ({ ...prev, file_code: generatedCode }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="קורס"
                  required
                  error={hasAttemptedSubmit && !!formErrors.course_id}
                  helperText={hasAttemptedSubmit ? formErrors.course_id : ''}
                />
              )}
              noOptionsText="לא נמצאו קורסים"
              fullWidth
            />
            
            <FormControl fullWidth error={hasAttemptedSubmit && !!formErrors.file_type} required sx={{ direction: 'rtl' }}>
              <InputLabel id="file-type-label" sx={{ textAlign: 'left', transformOrigin: 'top left', direction: 'ltr' }}>סוג הקובץ</InputLabel>
              <Select
                labelId="file-type-label"
                name="file_type"
                value={formData.file_type}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, file_type: e.target.value }));
                  if (formErrors.file_type) {
                    setFormErrors(prev => ({ ...prev, file_type: undefined }));
                  }
                  
                  // Reset attempt flag when user starts interacting with form
                  if (hasAttemptedSubmit) {
                    setHasAttemptedSubmit(false);
                  }
                  
                  // Reset file code when file type changes
                  if (formData.course_id && e.target.value && !isFileCodeEditable) {
                    const generatedCode = generateFileCode(formData.course_id, e.target.value);
                    setFormData(prev => ({ ...prev, file_code: generatedCode }));
                  }
                }}
                label="סוג הקובץ"
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: 'right',
                    direction: 'rtl'
                  }
                }}
              >
                <MenuItem value="note" sx={{ textAlign: 'right', direction: 'rtl' }}>הרצאות וסיכומים</MenuItem>
                <MenuItem value="exam" sx={{ textAlign: 'right', direction: 'rtl' }}>מבחני תרגול</MenuItem>
                <MenuItem value="formulas" sx={{ textAlign: 'right', direction: 'rtl' }}>דף נוסחאות</MenuItem>
                <MenuItem value="assignment" sx={{ textAlign: 'right', direction: 'rtl' }}>מטלות</MenuItem>
                <MenuItem value="other" sx={{ textAlign: 'right', direction: 'rtl' }}>אחר</MenuItem>
              </Select>
              {hasAttemptedSubmit && formErrors.file_type && <Typography color="error" variant="caption">{formErrors.file_type}</Typography>}
            </FormControl>
            
            <TextField
              name="file_code"
              label="קוד קובץ"
              value={formData.file_code}
              onChange={handleFormChange}
              error={hasAttemptedSubmit && Boolean(formErrors.file_code)}
              helperText={
                (hasAttemptedSubmit && formErrors.file_code) ? formErrors.file_code : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Lock size={16} style={{ color: '#ff9800' }} />
                    <span>קוד הקובץ יתמלא אוטומטית לאחר בחירת קורס וסוג קובץ</span>
                  </Box>
                )
              }
              required
              fullWidth
              InputProps={{
                readOnly: !isFileCodeEditable
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: !isFileCodeEditable ? '#ff9800' : undefined,
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: !isFileCodeEditable ? '#ff9800' : undefined,
                  },
                },
              }}
              placeholder="יתמלא אוטומטית..."
            />
            
            <Box>
              <Button variant="outlined" component="label" fullWidth sx={{ py: 2 }}>
                {selectedFile ? selectedFile.name : 'בחר קובץ להעלאה'}
                <input 
                  type="file" 
                  hidden 
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.txt,.pptx,.xlsx"
                  onChange={handleFileChange}
                />
              </Button>
              {hasAttemptedSubmit && formErrors.file && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{formErrors.file}</Typography>}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog}>
            ביטול
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || !isFormValid}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <CloudUpload />}
          >
            {isSubmitting ? 'מוסיף...' : 'הוסף קובץ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}







