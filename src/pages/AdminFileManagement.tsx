
import { useState, useEffect, ChangeEvent } from 'react';
import { File as FileEntity, Course, Student, User, Lecturer } from '@/api/entities';
import { purple, red, green, orange, blue, pink } from '@mui/material/colors';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, IconButton, CircularProgress, Chip, Avatar,
    ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
    Autocomplete
} from '@mui/material';
import { FileText, Trash2, Check, X, Download, Clock, ArrowRight, Plus, CloudUpload, User as UserIcon, GraduationCap, Shield, ChevronUp, ChevronDown, Filter, Lock, Unlock } from 'lucide-react';
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
  file_code?: string; // מספר ייחודי לקובץ
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
  name?: string; // Legacy field
  course_code?: string;
  code?: string; // Legacy field
};

type StudentInfo = {
  id: string;
  full_name: string;
};

type LecturerInfo = {
  id: string;
  full_name?: string;
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

export default function AdminFileManagement() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [coursesMap, setCoursesMap] = useState<{ [key: string]: string }>({});
  const [studentsMap, setStudentsMap] = useState<{ [key: string]: string }>({});
  const [lecturersMap, setLecturersMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
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
  const [isFileCodeEditable, setIsFileCodeEditable] = useState(false);
  
  // Sorting and filtering state
  const [sortField, setSortField] = useState<keyof FileInfo | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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
  
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadData();
    // Set default sorting on initial load
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
    
    if (filters.uploader) {
      filtered = filtered.filter(file => 
        (studentsMap[file.uploader_id] || lecturersMap[file.uploader_id] || '').toLowerCase().includes(filters.uploader.toLowerCase())
      );
    }
    
    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(file => file.uploader_type === roleFilter);
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
          case 'uploader_id':
            aValue = studentsMap[a.uploader_id] || lecturersMap[a.uploader_id] || '';
            bValue = studentsMap[b.uploader_id] || lecturersMap[b.uploader_id] || '';
            break;
          case 'uploader_type':
            aValue = a.uploader_type;
            bValue = b.uploader_type;
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
      if (aFile !== bFile) {
        return aFile.localeCompare(bFile, 'he');
      }
      
      // Quaternary sort: Creation date (newest first)
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return bDate.getTime() - aDate.getTime();
    });
    
    setFilteredFiles(filtered);
  }, [statusFilter, files, filters, roleFilter, sortField, sortDirection, coursesMap, studentsMap, lecturersMap]);

  // Auto-generate file code when course and file type are selected
  useEffect(() => {
    if (formData.course_id && formData.file_type && !isFileCodeEditable) {
      const generatedCode = generateFileCode(formData.course_id, formData.file_type);
      if (generatedCode) {
        setFormData(prev => ({ ...prev, file_code: generatedCode }));
        setIsFileCodeEditable(true);
      }
    }
  }, [formData.course_id, formData.file_type, isFileCodeEditable, courses, files]);

  // Validate form for dialog
  useEffect(() => {
    const isValid = 
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.course_id !== '' &&
      formData.file_type !== '' &&
      formData.file_code.trim() !== '' &&
      isFileCodeUnique(formData.file_code) &&
      selectedFile !== null;
    
    setIsFormValid(isValid);
  }, [formData, selectedFile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fileList, courseList, studentList, lecturerList] = await Promise.all([
        FileEntity.list(), 
        Course.list(), 
        Student.list(),
        Lecturer.list()
      ]);
      
      // Fix existing files - auto-approve files from lecturers and admins + generate file codes
      const validFiles = Array.isArray(fileList) ? fileList : [];
      const validCourses = Array.isArray(courseList) ? courseList : [];
      
      const fixedFiles = validFiles.map((file: FileInfo) => {
        let updatedFile = { ...file };
        
        // Auto-approve files from lecturers and admins
        if ((file.uploader_type === 'lecturer' || file.uploader_type === 'admin') && file.status !== 'approved') {
          updatedFile.status = 'approved' as const;
        }
        
        // Generate file_code if missing
        if (!file.file_code && file.course_id && file.file_type) {
          const course = validCourses.find((c: CourseInfo) => c.id === file.course_id);
          if (course) {
            const courseCode = course.course_code || course.code || 'FILE';
            const typePrefix = {
              'note': 'N',
              'exam': 'E', 
              'formulas': 'F',
              'assignment': 'A',
              'other': 'O'
            }[file.file_type] || 'O';
            
            // Find next available number for this course and type
            const existingCodes = validFiles
              .filter(f => f.file_code && f.file_code.startsWith(`${courseCode}-${typePrefix}`))
              .map(f => {
                const match = f.file_code!.match(/\d+$/);
                return match ? parseInt(match[0]) : 0;
              });
            
            const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
            updatedFile.file_code = `${courseCode}-${typePrefix}${nextNumber.toString().padStart(3, '0')}`;
          }
        }
        
        return updatedFile;
      });
      
      // Update localStorage if any files were fixed
      const hasChanges = fixedFiles.some((file, index) => 
        validFiles[index] && (
          file.status !== validFiles[index].status ||
          file.file_code !== validFiles[index].file_code
        )
      );
      
      if (hasChanges) {
        // Update files in localStorage
        const currentData = JSON.parse(localStorage.getItem('mock_files') || '[]');
        const updatedData = currentData.map((file: any) => {
          const fixedFile = fixedFiles.find((f: FileInfo) => f.id === file.id);
          return fixedFile || file;
        });
        localStorage.setItem('mock_files', JSON.stringify(updatedData));
        console.log('Fixed lecturer/admin files status to approved and generated file codes');
      }
      
      setFiles(fixedFiles);
      
      // Re-apply filter after files are loaded
      if (statusFilter === 'all') {
        setFilteredFiles(fixedFiles);
      } else {
        setFilteredFiles(fixedFiles.filter((file: FileInfo) => file.status === statusFilter));
      }

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
      fileType: '',
      uploader: ''
    });
    setRoleFilter('all');
    setStatusFilter('all');
    setSortField('created_at');
    setSortDirection('desc');
  };

  const generateFileCode = (courseId: string, fileType: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return '';
    
    const courseCode = course.course_code || course.code || 'FILE';
    const typePrefix = {
      'note': 'N',
      'exam': 'E', 
      'formulas': 'F',
      'assignment': 'A',
      'other': 'O'
    }[fileType] || 'O';
    
    // Generate unique number based on existing file_codes
    const existingCodes = files
      .map(f => f.file_code || '')
      .filter(code => code.startsWith(`${courseCode}-${typePrefix}`))
      .map(code => {
        const match = code.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      });
    
    const nextNumber = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
    return `${courseCode}-${typePrefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  const isFileCodeUnique = (code: string) => {
    if (!code.trim()) return false;
    return !files.some(f => (f.file_code || '').toLowerCase() === code.toLowerCase());
  };

  // Dialog handlers
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
    setIsFormValid(false);
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
    setIsFormValid(false);
    setIsFileCodeEditable(false);
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    if (formErrors.file) {
      setFormErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'שם הקובץ הוא שדה חובה';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'תיאור הקובץ הוא שדה חובה';
    }
    
    if (!formData.course_id) {
      errors.course_id = 'יש לבחור קורס';
    }
    
    if (!formData.file_type) {
      errors.file_type = 'יש לבחור סוג קובץ';
    }
    
    if (!formData.file_code.trim()) {
      errors.file_code = 'קוד הקובץ הוא שדה חובה';
    } else if (!isFileCodeUnique(formData.file_code)) {
      errors.file_code = 'קוד קובץ זה כבר קיים במערכת';
    }
    
    if (!selectedFile) {
      errors.file = 'יש לבחור קובץ להעלאה';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const currentUser = await User.me();
      let uploaderRecord;
      
      // Find uploader record
      if (currentUser.current_role === 'student') {
        const studentRecords = await Student.filter({ user_id: currentUser.id });
        if (Array.isArray(studentRecords) && studentRecords.length > 0) uploaderRecord = studentRecords[0];
      } else if (currentUser.current_role === 'lecturer') {
        const lecturerRecords = await Lecturer.filter({ user_id: currentUser.id });
        if (Array.isArray(lecturerRecords) && lecturerRecords.length > 0) uploaderRecord = lecturerRecords[0];
      } else { // Admin
        const studentRecords = await Student.filter({ user_id: currentUser.id });
        if (Array.isArray(studentRecords) && studentRecords.length > 0) {
          uploaderRecord = studentRecords[0];
        } else {
          const lecturerRecords = await Lecturer.filter({ user_id: currentUser.id });
          if (Array.isArray(lecturerRecords) && lecturerRecords.length > 0) uploaderRecord = lecturerRecords[0];
        }
      }

      if (!uploaderRecord) {
        throw new Error("פרופיל המשתמש לא נמצא. אנא פנה למנהל המערכת.");
      }

      // Auto-approve files from lecturers and admins, students need approval
      const status = currentUser.current_role === 'student' ? 'pending' : 'approved';

      const newFile = {
        filename: formData.file_code,
        original_name: selectedFile?.name || formData.title,
        file_type: formData.file_type,
        file_size: selectedFile?.size || 0,
        course_id: formData.course_id,
        uploader_id: uploaderRecord.id,
        uploader_type: currentUser.current_role as 'student' | 'lecturer' | 'admin',
        status,
        download_count: 0,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: formData.title,
        description: formData.description,
        file_code: formData.file_code
      };

      await FileEntity.create(newFile);
      handleCloseDialog();
      loadData(); // Refresh the list
      
      // Show success message
      alert('הקובץ נוסף בהצלחה!');
    } catch (error) {
      console.error("Failed to create file:", error);
      alert('שגיאה בהוספת הקובץ. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusComponent = (status: 'approved' | 'rejected' | 'pending') => {
    switch (status) {
      case 'approved':
        return <Chip label="מאושר" color="success" size="small" icon={<Check size={20} color={green[800]} />} sx={{ bgcolor: green[100], color: green[800], width: '100px' }} />;
      case 'rejected':
        return <Chip label="נדחה" color="error" size="small" icon={<X size={20} color={red[800]} />} sx={{ bgcolor: red[100], color: red[800], width: '100px' }} />;
      case 'pending':
        return <Chip label="ממתין" color="warning" size="small" icon={<Clock size={20} color={orange[800]} />} sx={{ bgcolor: orange[100], color: orange[800], width: '100px' }} />;
    }
  };

  const getRoleComponent = (uploaderType: 'student' | 'lecturer' | 'admin') => {
    switch (uploaderType) {
      case 'student':
        return <Chip label="סטודנט" size="small" icon={<UserIcon size={20} color={blue[800]} />} sx={{ bgcolor: blue[50], color: blue[800], width: '80px' }} />;
      case 'lecturer':
        return <Chip label="מרצה" size="small" icon={<GraduationCap size={20} color={purple[800]} />} sx={{ bgcolor: purple[50], color: purple[800], width: '80px' }} />;
      case 'admin':
        return <Chip label="מנהל" size="small" icon={<Shield size={20} color={pink[800]} />} sx={{ bgcolor: pink[50], color: pink[800], width: '80px' }} />;
      default:
        return <Chip label="לא ידוע" color="default" size="small" icon={<UserIcon size={20} />} sx={{ width: '80px' }} />;
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'לא ידוע';
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        בחזרה לפאנל הניהול
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><FileText /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול קבצים</Typography>
          </Box>
          <Typography color="text.secondary">צפייה, אישור ומחיקה של קבצים במערכת</Typography>
        </Box>
        
        <Button 
          onClick={handleOpenDialog}
          variant="contained" 
          startIcon={<Plus />}
        >
          הוסף קובץ חדש
        </Button>
      </Box>

      {/* Add File Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle  textAlign="left" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
              fullWidth
            />
            
            <TextField
              name="description"
              label="תיאור הקובץ"
              value={formData.description}
              onChange={handleFormChange}
              error={!!formErrors.description}
              helperText={formErrors.description}
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
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="קורס"
                  required
                  error={!!formErrors.course_id}
                  helperText={formErrors.course_id}
                />
              )}
              noOptionsText="לא נמצאו קורסים"
              fullWidth
            />
            
            <FormControl fullWidth error={!!formErrors.file_type} required>
              <InputLabel id="file-type-label">סוג הקובץ</InputLabel>
              <Select
                labelId="file-type-label"
                name="file_type"
                value={formData.file_type}
                onChange={handleFormChange}
                label="סוג הקובץ"
              >
                <MenuItem value="note">הרצאות וסיכומים</MenuItem>
                <MenuItem value="exam">מבחני תרגול</MenuItem>
                <MenuItem value="formulas">דף נוסחאות</MenuItem>
                <MenuItem value="assignment">מטלות</MenuItem>
                <MenuItem value="other">אחר</MenuItem>
              </Select>
              {formErrors.file_type && <Typography color="error" variant="caption">{formErrors.file_type}</Typography>}
            </FormControl>
            
            <TextField
              name="file_code"
              label="קוד קובץ"
              value={formData.file_code}
              onChange={handleFormChange}
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
              error={Boolean(formData.file_code && !isFileCodeUnique(formData.file_code))}
              helperText={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {formData.file_code && !isFileCodeUnique(formData.file_code) ? (
                    <>
                      <X size={16} style={{ color: '#f44336' }} />
                      <span>קוד קובץ זה כבר קיים במערכת</span>
                    </>
                  ) : !formData.file_code || !isFileCodeEditable ? (
                    <>
                      <Lock size={16} style={{ color: '#ff9800' }} />
                      <span>קוד הקובץ יתמלא אוטומטית לאחר בחירת קורס וסוג קובץ</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={16} style={{ color: '#4caf50' }} />
                      <span>ניתן לערוך את קוד הקובץ לפי הצורך</span>
                    </>
                  )}
                </Box>
              }
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
              {formErrors.file && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{formErrors.file}</Typography>}
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

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={handleStatusChange}
          aria-label="סינון לפי סטטוס"
          sx={{ 
            gap: 1,
            mb: 2,
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
          <ToggleButton value="pending" aria-label="ממתין לאישור">
            ממתין לאישור
          </ToggleButton>
          <ToggleButton value="approved" aria-label="אושר">
            אושר
          </ToggleButton>
          <ToggleButton value="rejected" aria-label="נדחה">
            נדחה
          </ToggleButton>
        </ToggleButtonGroup>
        
        {/* Role Filter */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={roleFilter}
            exclusive
            onChange={(event, newRole) => {
              if (newRole !== null) {
                setRoleFilter(newRole);
              }
            }}
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
                    endIcon={
                      sortField === 'original_name' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                    endIcon={
                      sortField === 'file_code' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                    endIcon={
                      sortField === 'course_id' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                    endIcon={
                      sortField === 'file_type' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                    endIcon={
                      sortField === 'created_at' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                    endIcon={
                      sortField === 'uploader_id' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
                  >
                    מעלה הקובץ
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
                    endIcon={
                      sortField === 'uploader_type' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
                  >
                    תפקיד
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
                    endIcon={
                      sortField === 'download_count' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                    endIcon={
                      sortField === 'status' ? (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : <ChevronUp size={16} style={{ opacity: 0.3 }} />
                    }
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
                  <TableCell colSpan={10} align="center"><CircularProgress /></TableCell>
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
    </Box>
  );
}
