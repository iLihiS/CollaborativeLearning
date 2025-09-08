
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Student, AcademicTrack } from '@/api/entities';
import { FormValidator } from '@/utils/validation';
import { LocalStorageService } from '@/services/localStorage';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar, ToggleButtonGroup, ToggleButton,
    Alert, Autocomplete
} from '@mui/material';
import { Users, Plus, Edit, Trash2, ArrowRight, GraduationCap, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/* ❌ VIOLATION: Type Naming Standard - Types should use PascalCase */
type student_data = {
  id: string;
  full_name: string;
  student_id: string;
  national_id?: string;
  email: string;
  academic_track_ids: string[];
};

/* ❌ VIOLATION: Type Naming Standard - Types should use PascalCase */
type academic_track_data = {
  id: string;
  name: string;
  department: string;
  degree_type: string;
};

/* ❌ VIOLATION: Type Naming Standard - Types should use PascalCase */
type form_data = {
  full_name: string;
  student_id: string;
  national_id?: string;
  email: string;
  academic_track_ids: string[];
};

/* ❌ VIOLATION: Type Naming Standard - Types should use PascalCase */
type form_errors = {
  full_name?: string;
  student_id?: string;
  national_id?: string;
  email?: string;
  academic_track_ids?: string;
  general?: string;
};

/* ❌ VIOLATION: Component Naming Standard - Components should use PascalCase */
export default function admin_student_management() {
  const [students, setStudents] = useState<student_data[]>([]);
  /* ✅ FIXED: Variable Naming Standard - Now uses camelCase */
  const [filteredStudents, setFilteredStudents] = useState<student_data[]>([]);
  const [academicTracks, setAcademicTracks] = useState<academic_track_data[]>([]);
  const [academicTracksMap, setAcademicTracksMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  /* ✅ FIXED: Variable Naming Standard - Now uses camelCase */
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<student_data | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [formData, setFormData] = useState<form_data>({
    full_name: '',
    student_id: '',
    national_id: '',
    email: '',
    academic_track_ids: [],
  });
  const [formErrors, setFormErrors] = useState<form_errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting and filtering state
  const [sortField, setSortField] = useState<keyof student_data | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{
    full_name: string;
    student_id: string;
    national_id: string;
    email: string;
    academic_tracks: string;
  }>({
    full_name: '',
    student_id: '',
    national_id: '',
    email: '',
    academic_tracks: ''
  });

  useEffect(() => {
    loadData();
    // Set default sorting on initial load
    setSortField('full_name');
    setSortDirection('asc');
  }, []);

  useEffect(() => {
    let filtered = students;
    
    // Track filter
    if (trackFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.academic_track_ids && student.academic_track_ids.includes(trackFilter)
      );
    }
    
    // Column filters
    if (filters.full_name) {
      filtered = filtered.filter(student => 
        (student.full_name || '').toLowerCase().includes(filters.full_name.toLowerCase())
      );
    }
    
    if (filters.student_id) {
      filtered = filtered.filter(student => 
        (student.student_id || '').toLowerCase().includes(filters.student_id.toLowerCase())
      );
    }
    
    if (filters.national_id) {
      filtered = filtered.filter(student => 
        (student.national_id || '').toLowerCase().includes(filters.national_id.toLowerCase())
      );
    }
    
    if (filters.email) {
      filtered = filtered.filter(student => 
        (student.email || '').toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    
    if (filters.academic_tracks) {
      filtered = filtered.filter(student => {
        const trackNames = (student.academic_track_ids || [])
          .map(trackId => academicTracksMap[trackId] || '')
          .join(' ');
        return trackNames.toLowerCase().includes(filters.academic_tracks.toLowerCase());
      });
    }
    
    // Sorting with multi-level fallback
    filtered.sort((a, b) => {
      // Primary sort
      if (sortField) {
        let aValue: any = '';
        let bValue: any = '';
        
        switch (sortField) {
          case 'full_name':
            aValue = a.full_name || '';
            bValue = b.full_name || '';
            break;
          case 'student_id':
            aValue = a.student_id || '';
            bValue = b.student_id || '';
            break;
          case 'national_id':
            aValue = a.national_id || '';
            bValue = b.national_id || '';
            break;
          case 'email':
            aValue = a.email || '';
            bValue = b.email || '';
            break;
          case 'academic_track_ids':
            aValue = (a.academic_track_ids || []).map(id => academicTracksMap[id] || '').join(', ');
            bValue = (b.academic_track_ids || []).map(id => academicTracksMap[id] || '').join(', ');
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
      
      // Secondary sort: Full name (alphabetical)
      const aName = a.full_name || '';
      const bName = b.full_name || '';
      if (aName !== bName) {
        return aName.localeCompare(bName, 'he');
      }
      
      // Tertiary sort: Student ID (alphabetical)
      const aId = a.student_id || '';
      const bId = b.student_id || '';
      return aId.localeCompare(bId, 'he');
    });
    
    setFilteredStudents(filtered);
  }, [trackFilter, students, filters, sortField, sortDirection, academicTracksMap]);

  /* ✅ FIXED: Function Naming Standard - Now uses camelCase */
  const loadData = async () => {
    setLoading(true);
    try {
      const [studentList, trackList] = await Promise.all([
        Student.list(),
        AcademicTrack.list()
      ]);
      console.log('Students loaded:', studentList);
      console.log('Academic tracks loaded:', trackList);
      const validStudents = Array.isArray(studentList) ? studentList : [];
      const validTracks = Array.isArray(trackList) ? trackList : [];
      
      // Create academic tracks map
      const tracksMap: { [key: string]: string } = {};
      validTracks.forEach((track: academic_track_data) => {
        tracksMap[track.id] = track.name;
      });
      
      setStudents(validStudents);
      setFilteredStudents(validStudents);
      setAcademicTracks(validTracks);
      setAcademicTracksMap(tracksMap);
      console.log('Final academic tracks count:', validTracks.length);
      console.log('Academic tracks data:', validTracks.slice(0, 3)); // Show first 3 tracks
    } catch (error) {
      console.error("Error loading data:", error);
      setStudents([]);
      setFilteredStudents([]);
      setAcademicTracks([]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (student: student_data | null = null) => {
    setEditingStudent(student);
    if (student) {
      setFormData({
        full_name: student.full_name,
        student_id: student.student_id,
        national_id: (student as any).national_id || '',
        email: student.email,
        academic_track_ids: student.academic_track_ids || [],
      });
    } else {
      // Generate automatic student ID for new students
      const generateStudentId = () => {
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-4);
        return `${year}${timestamp}`;
      };
      const nextStudentId = generateStudentId();
      setFormData({ 
        full_name: '', 
        student_id: nextStudentId, 
        national_id: '', 
        email: '', 
        academic_track_ids: [] 
      });
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrackToggle = (trackId: string) => {
    setFormData((prev) => ({
      ...prev,
      academic_track_ids: prev.academic_track_ids.includes(trackId)
        ? prev.academic_track_ids.filter(id => id !== trackId)
        : [...prev.academic_track_ids, trackId]
    }));
  };

  const handleTrackFilterChange = (event: any, newTrack: string) => {
    if (newTrack !== null) {
      setTrackFilter(newTrack);
    }
  };

  // Sorting functions
  const handleSort = (field: keyof student_data) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof student_data) => {
    if (sortField !== field) {
      return <ChevronUp size={16} style={{ opacity: 0.3 }} />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp size={16} /> : 
      <ChevronDown size={16} />;
  };

  // Filter functions
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      full_name: '',
      student_id: '',
      national_id: '',
      email: '',
      academic_tracks: ''
    });
    setTrackFilter('all');
    setSortField('full_name');
    setSortDirection('asc');
  };

  const getShortTrackName = (trackName: string) => {
    // החזרת השמות המלאים במקום קיצורים
    return trackName;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Validate the form
      const validationResult = await FormValidator.validateStudentForm(
        formData, 
        editingStudent?.id
      );

      if (!validationResult.isValid) {
        setFormErrors(validationResult.errors);
        setIsSubmitting(false);
        return;
      }

      const studentData = {
        ...formData,
        // Also set academic_track for backwards compatibility
        academic_track: formData.academic_track_ids.length > 0 ? formData.academic_track_ids[0] : '',
        year: 1, // Default year
        status: 'active' as const // Default status
      };

      if (editingStudent) {
        await Student.update(editingStudent.id, studentData);
      } else {
        await Student.create(studentData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Failed to save student:", error);
      setFormErrors({ general: 'שגיאה בשמירת הסטודנט. אנא נסה שוב.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק סטודנט זה?')) {
      try {
        await Student.delete(studentId);
        loadData();
      } catch (error) {
        console.error("Failed to delete student:", error);
        alert('שגיאה במחיקת הסטודנט.');
      }
    }
  };
  
  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc: { [key: string]: string }, track: academic_track_data) => {
    if (track) acc[track.id] = track.name;
    return acc;
  }, {});

  return (
    /* ❌ VIOLATION: CSS Naming Standard - Class names should use kebab-case */
    /* ❌ VIOLATION: HTML Best Practices - Should use semantic tags like <main> instead of <div> */
    <div className="MainContainer" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */}
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} 
              className="BackButton" style={{ marginBottom: '24px', borderColor: '#1976d2' }}>
        חזרה לפאנל הניהול
      </Button>

      {/* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */}
      {/* ❌ VIOLATION: HTML Best Practices - Should use semantic tags like <header> instead of <div> */}
      <div className="HeaderSection" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div className="TitleContainer" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            {/* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */}
            <Avatar className="TitleAvatar" style={{ backgroundColor: '#1976d2', width: '48px', height: '48px' }}><Users /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול סטודנטים</Typography>
          </div>
          <Typography color="text.secondary">הוספה, עריכה ומחיקה של סטודנטים רשומים</Typography>
        </div>
        {/* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */}
        <div className="ActionButtonsContainer" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
            הוסף סטודנט חדש
          </Button>
        </div>
      </div>

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={trackFilter}
          exclusive
          onChange={handleTrackFilterChange}
          aria-label="סינון לפי מסלול אקדמי"
          sx={{ 
            gap: 1,
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              px: 3,
              py: 0.5,
              fontWeight: 500,
              whiteSpace: 'nowrap',
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
          <ToggleButton value="all" aria-label="כל הסטודנטים">
            כל הסטודנטים
          </ToggleButton>
          {academicTracks.map((track) => (
            <ToggleButton key={track.id} value={track.id} aria-label={track.name}>
              {getShortTrackName(track.name)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        
        {/* Filter Row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <TextField
              size="small"
              placeholder="חפש שם..."
              value={filters.full_name}
              onChange={(e) => handleFilterChange('full_name', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              placeholder="חפש מספר סטודנט..."
              value={filters.student_id}
              onChange={(e) => handleFilterChange('student_id', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              placeholder="חפש ת.ז..."
              value={filters.national_id}
              onChange={(e) => handleFilterChange('national_id', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 120 }}
            />
            <TextField
              size="small"
              placeholder="חפש מייל..."
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              placeholder="חפש מסלול..."
              value={filters.academic_tracks}
              onChange={(e) => handleFilterChange('academic_tracks', e.target.value)}
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

      /* ❌ VIOLATION: CSS Naming Standard - Class names should use kebab-case */
      <Paper elevation={2} className="StudentsTablePaper">
        <TableContainer className="StudentsTableContainer">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('full_name')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('full_name')}
                  >
                    שם מלא
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('student_id')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('student_id')}
                  >
                    מספר סטודנט
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('national_id')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('national_id')}
                  >
                    תעודת זהות
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('email')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('email')}
                  >
                    כתובת מייל
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('academic_track_ids')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('academic_track_ids')}
                  >
                    מסלול אקדמי
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    disabled
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      cursor: 'default',
                      color: 'text.primary'
                    }}
                    endIcon={<ChevronUp size={16} style={{ opacity: 0 }} />}
                  >
                    פעולות
                  </Button>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredStudents) ? filteredStudents : []).map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell align="left">{student.full_name || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">
                    <Chip 
                      label={student.student_id || 'לא הוגדר'} 
                      size="small" 
                      icon={<Users color="#2e7d32" size={16} />}
                      sx={{ bgcolor: student.student_id  ? '#e8f5e8' : '#ffebee', color: student.student_id  ? '#2e7d32' : '#d32f2f', width: "120px" }}
                    />
                  </TableCell>
                  <TableCell align="left">{(student as any).national_id || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">{student.email || 'לא מוגדר'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(student.academic_track_ids && student.academic_track_ids.length > 0) ? 
                        student.academic_track_ids.map(trackId => (
                          <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                        )) : 
                        <Typography variant="body2" color="text.secondary">אין מסלולים</Typography>
                      }
                    </Box>
                  </TableCell>
                  <TableCell align="left">
                    <IconButton onClick={() => handleOpenDialog(student)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(student.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
        /* ❌ VIOLATION: CSS Naming Standard - Class names should use kebab-case */
        <DialogTitle textAlign="left" fontWeight="bold" className="DialogTitleStyle">{editingStudent ? 'עריכת סטודנט' : 'הוספת סטודנט חדש'}</DialogTitle>
        <DialogContent className="DialogContentArea">
          {/* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */}
          <form onSubmit={handleSubmit} className="FormContainer" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            {formErrors.general && (
              /* ❌ VIOLATION: CSS Best Practices - Should use CSS classes instead of inline styles */
              <Alert severity="error" className="ErrorAlert" style={{ marginBottom: '16px' }}>
                {formErrors.general}
              </Alert>
            )}

            <TextField 
              name="full_name" 
              label="שם מלא" 
              value={formData.full_name} 
              onChange={handleFormChange} 
              required 
              fullWidth
              error={!!formErrors.full_name}
              helperText={formErrors.full_name}
              placeholder="הכנס שם בעברית"
            />
            
            <TextField 
              name="student_id" 
              label="מספר סטודנט" 
              value={formData.student_id} 
              onChange={handleFormChange} 
              required 
              fullWidth
              disabled={!editingStudent} // Only allow editing for existing students
              error={!!formErrors.student_id}
              helperText={editingStudent ? formErrors.student_id : "מספר הסטודנט נוצר אוטומטית"}
              placeholder="מספר סטודנט יוקצה אוטומטית"
            />

            <TextField 
              name="national_id" 
              label="תעודת זהות" 
              value={formData.national_id || ''} 
              onChange={handleFormChange} 
              required
              fullWidth
              error={!!formErrors.national_id}
              helperText={formErrors.national_id || "שדה חובה - לא ניתן ליצור סטודנט ללא תעודת זהות"}
              placeholder="9 ספרות"
              inputProps={{ maxLength: 9 }}
            />
            
            <TextField 
              name="email" 
              type="email" 
              label="כתובת אימייל" 
              value={formData.email} 
              onChange={handleFormChange} 
              required 
              fullWidth
              error={!!formErrors.email}
              helperText={formErrors.email}
              placeholder="student@ono.ac.il"
            />


            <Autocomplete
              multiple
              options={academicTracks}
              getOptionLabel={(option) => option.name}
              value={academicTracks.filter(track => formData.academic_track_ids.includes(track.id))}
              onChange={(_, newValues) => {
                setFormData(prev => ({
                  ...prev,
                  academic_track_ids: newValues.map(track => track.id)
                }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="מסלולים אקדמיים" 
                  required 
                  fullWidth
                  error={!!formErrors.academic_track_ids}
                  helperText={formErrors.academic_track_ids || "בחר מסלול אקדמי אחד או יותר עבור הסטודנט"}
                  placeholder="בחר מסלולים אקדמיים..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.department} • {option.degree_type}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="אין מסלולים זמינים"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
          >
            {isSubmitting ? 'שומר...' : 'שמור'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
