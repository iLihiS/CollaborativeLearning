
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Lecturer, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Box, Typography, Paper, IconButton, CircularProgress, Chip, Avatar, 
    ToggleButtonGroup, ToggleButton, Autocomplete
} from '@mui/material';
import { GraduationCap, Plus, Edit, Trash2, ArrowRight, User, Lock, Unlock, X, ChevronUp, ChevronDown, Filter, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type LecturerData = {
  id: string;
  full_name: string;
  email: string;
  employee_id?: string;
  academic_track_ids: string[];
};

type AcademicTrackData = {
  id: string;
  name: string;
  department: string;
};

type FormData = {
  full_name: string;
  email: string;
  employee_id: string;
  academic_track_ids: string[];
};

type FormErrors = {
  full_name?: string;
  email?: string;
  employee_id?: string;
  academic_track_ids?: string;
};

export default function AdminLecturerManagement() {
  const [lecturers, setLecturers] = useState<LecturerData[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [academicTracksMap, setAcademicTracksMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<LecturerData | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    employee_id: '',
    academic_track_ids: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isEmployeeIdEditable, setIsEmployeeIdEditable] = useState(false);

  // Sorting and filtering state
  const [sortField, setSortField] = useState<keyof LecturerData | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{
    full_name: string;
    email: string;
    employee_id: string;
    academic_tracks: string;
  }>({
    full_name: '',
    email: '',
    employee_id: '',
    academic_tracks: ''
  });

  useEffect(() => {
    loadData();
    // Set default sorting on initial load
    setSortField('full_name');
    setSortDirection('asc');
  }, []);

  useEffect(() => {
    let filtered = lecturers;
    
    // Track filter
    if (trackFilter !== 'all') {
      filtered = filtered.filter(lecturer => 
        lecturer.academic_track_ids && lecturer.academic_track_ids.includes(trackFilter)
      );
    }
    
    // Column filters
    if (filters.full_name) {
      filtered = filtered.filter(lecturer => 
        (lecturer.full_name || '').toLowerCase().includes(filters.full_name.toLowerCase())
      );
    }
    
    if (filters.email) {
      filtered = filtered.filter(lecturer => 
        (lecturer.email || '').toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    
    if (filters.employee_id) {
      filtered = filtered.filter(lecturer => 
        (lecturer.employee_id || '').toLowerCase().includes(filters.employee_id.toLowerCase())
      );
    }
    
    if (filters.academic_tracks) {
      filtered = filtered.filter(lecturer => {
        const trackNames = (lecturer.academic_track_ids || [])
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
          case 'email':
            aValue = a.email || '';
            bValue = b.email || '';
            break;
          case 'employee_id':
            aValue = a.employee_id || '';
            bValue = b.employee_id || '';
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
      
      // Tertiary sort: Employee ID (alphabetical)
      const aId = a.employee_id || '';
      const bId = b.employee_id || '';
      return aId.localeCompare(bId, 'he');
    });
    
    setFilteredLecturers(filtered);
  }, [trackFilter, lecturers, filters, sortField, sortDirection, academicTracksMap]);

  // Auto-generate employee ID for new lecturers
  useEffect(() => {
    if (!editingLecturer && !formData.employee_id && !isEmployeeIdEditable) {
      const generatedId = generateEmployeeId();
      setFormData(prev => ({ ...prev, employee_id: generatedId }));
      setIsEmployeeIdEditable(true);
    }
  }, [formData.full_name, editingLecturer, isEmployeeIdEditable, lecturers]);

  // Validate form
  useEffect(() => {
    const isValid = 
      formData.full_name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.employee_id.trim() !== '' &&
      isEmployeeIdUnique(formData.employee_id) &&
      formData.academic_track_ids.length > 0;
    
    setIsFormValid(isValid);
  }, [formData, editingLecturer]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lecturerList, trackList] = await Promise.all([
        Lecturer.list(),
        AcademicTrack.list()
      ]);
      const validLecturers = Array.isArray(lecturerList) ? lecturerList : [];
      const validTracks = Array.isArray(trackList) ? trackList : [];
      
      // Create academic tracks map
      const tracksMap: { [key: string]: string } = {};
      validTracks.forEach((track: AcademicTrackData) => {
        tracksMap[track.id] = track.name;
      });
      
      // Fix lecturers without academic tracks - assign default track
      const fixedLecturers = validLecturers.map((lecturer: LecturerData) => {
        if (!lecturer.academic_track_ids || lecturer.academic_track_ids.length === 0) {
          // Assign a default academic track based on lecturer's field or use first available
          const defaultTrack = validTracks.length > 0 ? validTracks[0].id : 'cs-undergrad';
          console.log(`⚠️ Fixing lecturer ${lecturer.full_name} - assigning default track: ${defaultTrack}`);
          return {
            ...lecturer,
            academic_track_ids: [defaultTrack]
          };
        }
        return lecturer;
      });
      
      // Update localStorage if any lecturers were fixed
      const hasChanges = fixedLecturers.some((lecturer, index) => 
        validLecturers[index] && 
        JSON.stringify(lecturer.academic_track_ids) !== JSON.stringify(validLecturers[index].academic_track_ids)
      );
      
      if (hasChanges) {
        // Update lecturers in localStorage
        const currentData = JSON.parse(localStorage.getItem('mock_lecturers') || '[]');
        const updatedData = currentData.map((lecturer: any) => {
          const fixedLecturer = fixedLecturers.find((l: LecturerData) => l.id === lecturer.id);
          return fixedLecturer || lecturer;
        });
        localStorage.setItem('mock_lecturers', JSON.stringify(updatedData));
        console.log('✅ Fixed lecturers without academic tracks in localStorage');
      }
      
      setLecturers(fixedLecturers);
      setFilteredLecturers(fixedLecturers);
      setAcademicTracks(validTracks);
      setAcademicTracksMap(tracksMap);
    } catch (error) {
      console.error("Error loading data:", error);
      setLecturers([]);
      setFilteredLecturers([]);
      setAcademicTracks([]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (lecturer: LecturerData | null = null) => {
    setEditingLecturer(lecturer);
    if (lecturer) {
      setFormData({
        full_name: lecturer.full_name,
        email: lecturer.email,
        employee_id: lecturer.employee_id || '',
        academic_track_ids: lecturer.academic_track_ids || [],
      });
      setIsEmployeeIdEditable(!!lecturer.employee_id);
    } else {
      setFormData({ 
        full_name: '', 
        email: '', 
        employee_id: '',
        academic_track_ids: [] 
      });
      setIsEmployeeIdEditable(false);
    }
    setFormErrors({});
    setIsFormValid(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLecturer(null);
    setFormErrors({});
    setIsFormValid(false);
    setIsEmployeeIdEditable(false);
  };

  const generateEmployeeId = () => {
    const existingIds = lecturers
      .map(l => l.employee_id)
      .filter(id => id && id.startsWith('EMP'))
      .map(id => {
        const match = id?.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      });
    
    const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    return `EMP${nextNumber.toString().padStart(4, '0')}`;
  };

  const isEmployeeIdUnique = (id: string) => {
    if (!id.trim()) return false;
    return !lecturers.some(l => l.employee_id?.toLowerCase() === id.toLowerCase() && l.id !== editingLecturer?.id);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'שם מלא הוא שדה חובה';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'כתובת מייל היא שדה חובה';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'כתובת מייל לא תקינה';
    }
    
    if (!formData.employee_id.trim()) {
      errors.employee_id = 'מספר עובד הוא שדה חובה';
    } else if (!isEmployeeIdUnique(formData.employee_id)) {
      errors.employee_id = 'מספר עובד זה כבר קיים במערכת';
    }
    
    if (formData.academic_track_ids.length === 0) {
      errors.academic_track_ids = 'יש לבחור לפחות מסלול אקדמי אחד';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  const getShortTrackName = (trackName: string) => {
    // Return full names instead of abbreviations
    return trackName;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    
    try {
      if (editingLecturer) {
        await Lecturer.update(editingLecturer.id, formData);
      } else {
        await Lecturer.create(formData);
      }
      handleCloseDialog();
      loadData();
      alert('המרצה נשמר בהצלחה!');
    } catch (error) {
      console.error("Failed to save lecturer:", error);
      alert('שגיאה בשמירת המרצה.');
    }
  };

  const handleDelete = async (lecturerId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מרצה זה?')) {
      try {
        await Lecturer.delete(lecturerId);
        loadData();
      } catch (error) {
        console.error("Failed to delete lecturer:", error);
        alert('שגיאה במחיקת המרצה.');
      }
    }
  };

  // Sorting functions
  const handleSort = (field: keyof LecturerData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof LecturerData) => {
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
      email: '',
      employee_id: '',
      academic_tracks: ''
    });
    setTrackFilter('all');
    setSortField('full_name');
    setSortDirection('asc');
  };
  
  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc: { [key: string]: string }, track: AcademicTrackData) => {
    if (track) acc[track.id] = track.name;
    return acc;
  }, {});

  return (
    <Box sx={{ p: 2, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        חזרה לפאנל הניהול
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><GraduationCap /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול מרצים</Typography>
          </Box>
          <Typography color="text.secondary">הוספה, עריכה וניהול של סגל המרצים</Typography>
        </Box>
        <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
          הוסף מרצה חדש
        </Button>
      </Box>

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
          <ToggleButton value="all" aria-label="כל המרצים">
            כל המרצים
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
              placeholder="חפש מספר עובד..."
              value={filters.employee_id}
              onChange={(e) => handleFilterChange('employee_id', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
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

      <Paper elevation={2}>
        <TableContainer>
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
                    onClick={() => handleSort('employee_id')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('employee_id')}
                  >
                    מספר עובד
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
                    מסלולים אקדמיים
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
                  <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredLecturers) ? filteredLecturers : []).map((lecturer) => (
                <TableRow key={lecturer.id} hover>
                  <TableCell align="left">{lecturer.full_name || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">
                    <Chip 
                      label={lecturer.employee_id || 'לא הוגדר'} 
                      size="small" 
                      icon={<Users color="#2e7d32" size={16} />}
                      sx={{ bgcolor: lecturer.employee_id  ? '#e8f5e8' : '#ffebee', color: lecturer.employee_id  ? '#2e7d32' : '#d32f2f', width: "120px" }}
                    />
                  </TableCell>
                  <TableCell align="left">{lecturer.email || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(lecturer.academic_track_ids && lecturer.academic_track_ids.length > 0) ? 
                        lecturer.academic_track_ids.map(trackId => (
                          <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                        )) : 
                        <Chip 
                          label="לא מקושר למסלולים" 
                          size="small" 
                          color="error"
                          icon={<X />}
                        />
                      }
                    </Box>
                  </TableCell>
                  <TableCell align="left">
                    <IconButton onClick={() => handleOpenDialog(lecturer)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(lecturer.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle textAlign="left" fontWeight="bold">
          {editingLecturer ? 'עריכת מרצה' : 'הוספת מרצה חדש'}
        </DialogTitle>
        <DialogContent>
          {!editingLecturer && (
            <Box sx={{ 
              bgcolor: '#e8f5e8', 
              border: '1px solid #4caf50', 
              borderRadius: 1, 
              p: 2, 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <GraduationCap size={20} style={{ color: '#4caf50' }} />
              <Typography variant="body2" color="#2e7d32">
                <strong>שים לב:</strong> כל מרצה חייב להיות מקושר לפחות למסלול אקדמי אחד
              </Typography>
            </Box>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              name="full_name" 
              label="שם מלא" 
              value={formData.full_name} 
              onChange={handleFormChange} 
              required 
              fullWidth 
              error={!!formErrors.full_name}
              helperText={formErrors.full_name}
            />
            <TextField 
              name="email" 
              type="email" 
              label="כתובת מייל" 
              value={formData.email} 
              onChange={handleFormChange} 
              required 
              fullWidth 
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              name="employee_id"
              label="מספר עובד"
              value={formData.employee_id}
              onChange={handleFormChange}
              required
              fullWidth
              InputProps={{
                readOnly: !isEmployeeIdEditable
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: !isEmployeeIdEditable ? '#ff9800' : undefined,
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: !isEmployeeIdEditable ? '#ff9800' : undefined,
                  },
                },
              }}
              error={Boolean(formData.employee_id && !isEmployeeIdUnique(formData.employee_id))}
              helperText={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {formData.employee_id && !isEmployeeIdUnique(formData.employee_id) ? (
                    <>
                      <X size={16} style={{ color: '#f44336' }} />
                      <span>מספר עובד זה כבר קיים במערכת</span>
                    </>
                  ) : !formData.employee_id || !isEmployeeIdEditable ? (
                    <>
                      <Lock size={16} style={{ color: '#ff9800' }} />
                      <span>מספר העובד יתמלא אוטומטית</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={16} style={{ color: '#4caf50' }} />
                      <span>ניתן לערוך את מספר העובד לפי הצורך</span>
                    </>
                  )}
                </Box>
              }
              placeholder="יתמלא אוטומטית..."
            />
            
            <Autocomplete
              multiple
              options={academicTracks}
              getOptionLabel={(option) => `${option.name} (${option.department})`}
              value={academicTracks.filter(track => formData.academic_track_ids.includes(track.id))}
              onChange={(event, newValue) => {
                setFormData(prev => ({ 
                  ...prev, 
                  academic_track_ids: newValue.map(track => track.id) 
                }));
                if (formErrors.academic_track_ids) {
                  setFormErrors(prev => ({ ...prev, academic_track_ids: undefined }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="מסלולים אקדמיים"
                  required
                  error={!!formErrors.academic_track_ids}
                  helperText={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {formErrors.academic_track_ids ? (
                        <>
                          <X size={16} style={{ color: '#f44336' }} />
                          <span>{formErrors.academic_track_ids}</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap size={16} style={{ color: '#4caf50' }} />
                          <span>כל מרצה חייב להיות מקושר לפחות למסלול אקדמי אחד</span>
                        </>
                      )}
                    </Box>
                  }
                />
              )}
              noOptionsText="לא נמצאו מסלולים אקדמיים"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!isFormValid}
            startIcon={<Plus />}
          >
            {editingLecturer ? 'עדכן מרצה' : 'הוסף מרצה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
