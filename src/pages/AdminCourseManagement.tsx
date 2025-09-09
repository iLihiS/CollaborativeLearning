import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Course, AcademicTrack, Lecturer } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar, Select, MenuItem, FormControl, InputLabel,
    ToggleButtonGroup, ToggleButton, Autocomplete
} from '@mui/material';
import { BookOpen, Plus, Edit, Trash2, ArrowRight, GraduationCap, Lock, Unlock, X, AlertTriangle, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type CourseData = {
  id: string;
  course_name?: string;
  course_code?: string;
  name?: string; // Legacy field
  code?: string; // Legacy field
  lecturer?: string; // Legacy field
  lecturer_id?: string; // Legacy field
  lecturer_ids?: string[]; // New field for multiple lecturers
  credits: number;
  academic_track_ids?: string[];
  academic_track?: string; // Legacy field
};

type AcademicTrackData = {
  id: string;
  name: string;
  department: string;
};

type FormData = {
  course_name: string;
  course_code: string;
  lecturer_ids: string[];
  credits: number;
  academic_track_ids: string[];
};

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [academicTracksMap, setAcademicTracksMap] = useState<{ [key: string]: string }>({});
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [lecturersMap, setLecturersMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [formData, setFormData] = useState<FormData>({
    course_name: '',
    course_code: '',
    lecturer_ids: [],
    credits: 0,
    academic_track_ids: [],
  });
  const [isFormValid, setIsFormValid] = useState(false);

  // Sorting and filtering state
  const [sortField, setSortField] = useState<keyof CourseData | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{
    course_name: string;
    course_code: string;
    lecturer: string;
    credits: string;
    academic_tracks: string;
  }>({
    course_name: '',
    course_code: '',
    lecturer: '',
    credits: '',
    academic_tracks: ''
  });

  useEffect(() => {
    loadData();
    // Set default sorting on initial load
    setSortField('course_name');
    setSortDirection('asc');
  }, []);

  useEffect(() => {
    let filtered = courses;
    
    // Track filter
    if (trackFilter !== 'all') {
      filtered = filtered.filter(course => 
        course.academic_track_ids && course.academic_track_ids.includes(trackFilter)
      );
    }
    
    // Column filters
    if (filters.course_name) {
      filtered = filtered.filter(course => 
        (course.course_name || course.name || '').toLowerCase().includes(filters.course_name.toLowerCase())
      );
    }
    
    if (filters.course_code) {
      filtered = filtered.filter(course => 
        (course.course_code || course.code || '').toLowerCase().includes(filters.course_code.toLowerCase())
      );
    }
    
    if (filters.lecturer) {
      filtered = filtered.filter(course => {
        const lecturerNames = (course.lecturer_ids || [])
          .map(lecturerId => lecturersMap[lecturerId] || '')
          .join(' ');
        const legacyLecturer = course.lecturer || '';
        return (lecturerNames + ' ' + legacyLecturer).toLowerCase().includes(filters.lecturer.toLowerCase());
      });
    }
    
    if (filters.credits) {
      filtered = filtered.filter(course => 
        course.credits.toString().includes(filters.credits)
      );
    }
    
    if (filters.academic_tracks) {
      filtered = filtered.filter(course => {
        const trackNames = (course.academic_track_ids || [])
          .map(trackId => academicTracksMap[trackId] || '')
          .join(' ');
        const legacyTrack = course.academic_track || '';
        return (trackNames + ' ' + legacyTrack).toLowerCase().includes(filters.academic_tracks.toLowerCase());
      });
    }
    
    // Sorting with multi-level fallback
    filtered.sort((a, b) => {
      // Primary sort
      if (sortField) {
        let aValue: any = '';
        let bValue: any = '';
        
        switch (sortField) {
          case 'course_name':
            aValue = a.course_name || a.name || '';
            bValue = b.course_name || b.name || '';
            break;
          case 'course_code':
            aValue = a.course_code || a.code || '';
            bValue = b.course_code || b.code || '';
            break;
          case 'lecturer_ids':
            aValue = (a.lecturer_ids || []).map(id => lecturersMap[id] || '').join(', ') || a.lecturer || '';
            bValue = (b.lecturer_ids || []).map(id => lecturersMap[id] || '').join(', ') || b.lecturer || '';
            break;
          case 'credits':
            aValue = a.credits || 0;
            bValue = b.credits || 0;
            break;
          case 'academic_track_ids':
            aValue = (a.academic_track_ids || []).map(id => academicTracksMap[id] || '').join(', ') || a.academic_track || '';
            bValue = (b.academic_track_ids || []).map(id => academicTracksMap[id] || '').join(', ') || b.academic_track || '';
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
      const aName = a.course_name || a.name || '';
      const bName = b.course_name || b.name || '';
      if (aName !== bName) {
        return aName.localeCompare(bName, 'he');
      }
      
      // Tertiary sort: Course code (alphabetical)
      const aCode = a.course_code || a.code || '';
      const bCode = b.course_code || b.code || '';
      return aCode.localeCompare(bCode, 'he');
    });
    
    setFilteredCourses(filtered);
  }, [trackFilter, courses, filters, sortField, sortDirection, academicTracksMap, lecturersMap]);

  // Validate form
  useEffect(() => {
    const isValid = 
      formData.course_name.trim() !== '' &&
      formData.course_code.trim() !== '' &&
      isCourseCodeUnique(formData.course_code) &&
      formData.credits >= 1 && formData.credits <= 10 &&
      formData.academic_track_ids.length > 0 &&
      formData.lecturer_ids.length > 0;
    setIsFormValid(isValid);
  }, [formData, courses, editingCourse]);

  // Update existing courses to link with lecturers properly
  useEffect(() => {
    const updateExistingCourses = async () => {
      if (courses.length > 0 && lecturers.length > 0 && academicTracks.length > 0) {
        let hasUpdates = false;
        
        for (const course of courses) {
          if (course.academic_track_ids && course.academic_track_ids.length > 0) {
            const trackId = course.academic_track_ids[0];
            const matchingLecturers = lecturers.filter(lecturer => 
              lecturer.academic_tracks?.includes(trackId)
            );
            
            if (matchingLecturers.length === 0) {
              // Create a lecturer for this track
              await ensureLecturerForTrack(trackId);
              hasUpdates = true;
            }
          }
        }
        
        if (hasUpdates) {
          // Reload data to get updated lecturers
          setTimeout(() => loadData(), 1000);
        }
      }
    };
    
    updateExistingCourses();
  }, [courses.length, lecturers.length, academicTracks.length]);



  const loadData = async () => {
    setLoading(true);
    try {
      // Load academic tracks from public JSON file
      const trackResponse = await fetch('/academic-tracks.json');
      const trackList = await trackResponse.json();
      
      const [courseList, lecturerList] = await Promise.all([
        Course.list(),
        Lecturer.list()
      ]);
      console.log('Courses loaded:', courseList);
      console.log('Academic tracks in courses:', trackList);
      if (courseList.length > 0) {
        console.log('Sample course object:', courseList[0]);
        console.log('Course fields:', Object.keys(courseList[0]));
      }
      const validCourses = Array.isArray(courseList) ? courseList : [];
      const validTracks = Array.isArray(trackList) ? trackList : [];
      const validLecturers = Array.isArray(lecturerList) ? lecturerList : [];
      
      // Create maps
      const tracksMap: { [key: string]: string } = {};
      validTracks.forEach((track: AcademicTrackData) => {
        tracksMap[track.id] = track.name;
      });
      
      const lecMap: { [key: string]: string } = {};
      validLecturers.forEach((lecturer: any) => {
        lecMap[lecturer.id] = lecturer.full_name || lecturer.name || '';
      });
      
      setCourses(validCourses);
      setFilteredCourses(validCourses);
      setAcademicTracks(validTracks);
      setAcademicTracksMap(tracksMap);
      setLecturers(validLecturers);
      setLecturersMap(lecMap);
      console.log('Lecturers loaded:', lecturerList);
      
      // Fix courses that don't have proper academic_track_ids
      const updatedCourses = validCourses.map(course => {
        if (!course.academic_track_ids || course.academic_track_ids.length === 0) {
          // If course has legacy academic_track field, use it
          if (course.academic_track) {
            return {
              ...course,
              academic_track_ids: [course.academic_track]
            };
          }
          // Otherwise assign a default track based on course code or name
          let defaultTrack = 'cs-undergrad'; // Default fallback
          if (course.course_code || course.code) {
            const code = course.course_code || course.code;
            if (code.startsWith('CS')) defaultTrack = 'cs-undergrad';
            else if (code.startsWith('SE')) defaultTrack = 'swe-undergrad';
            else if (code.startsWith('MATH')) defaultTrack = 'math-undergrad';
            else if (code.startsWith('PHYS')) defaultTrack = 'physics-undergrad';
            else if (code.startsWith('LAW')) defaultTrack = 'law-undergrad';
            else if (code.startsWith('BUS')) defaultTrack = 'business-undergrad';
            else if (code.startsWith('PSY')) defaultTrack = 'psychology-undergrad';
          }
          return {
            ...course,
            academic_track_ids: [defaultTrack]
          };
        }
        return course;
      });
      
      // Update courses if any changes were made
      if (JSON.stringify(updatedCourses) !== JSON.stringify(validCourses)) {
        console.log('Updating courses with proper academic_track_ids...');
        // Update each course
        for (const course of updatedCourses) {
          if (course.id) {
            await Course.update(course.id, course);
          }
        }
        // Reload the updated courses
        const refreshedCourses = await Course.list();
        setCourses(Array.isArray(refreshedCourses) ? refreshedCourses : []);
        setFilteredCourses(Array.isArray(refreshedCourses) ? refreshedCourses : []);
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      setCourses([]);
      setFilteredCourses([]);
      setAcademicTracks([]);
    }
    setLoading(false);
  };

  const generateCourseCode = (trackId: string, existingCourses: CourseData[]) => {
    // Map track IDs to prefixes and base numbers
    const trackMapping = {
      'cs-undergrad': { prefix: 'CS', base: 100 },
      'cs-grad': { prefix: 'CS', base: 500 },
      'swe-undergrad': { prefix: 'SE', base: 100 },
      'math-undergrad': { prefix: 'MATH', base: 100 },
      'physics-undergrad': { prefix: 'PHYS', base: 100 },
      'law-undergrad': { prefix: 'LAW', base: 100 },
      'business-undergrad': { prefix: 'BUS', base: 100 },
      'business-grad': { prefix: 'BUS', base: 500 },
      'psychology-undergrad': { prefix: 'PSY', base: 100 },
      'education-grad': { prefix: 'EDU', base: 500 }
    };

    const mapping = trackMapping[trackId as keyof typeof trackMapping];
    if (!mapping) {
      return 'GEN101'; // Generic fallback
    }

    // Find existing courses with the same prefix
    const existingCodes = existingCourses
      .filter(course => {
        const code = course.course_code || course.code || '';
        return code.startsWith(mapping.prefix);
      })
      .map(course => {
        const code = course.course_code || course.code || '';
        const numberPart = code.replace(mapping.prefix, '');
        return parseInt(numberPart) || 0;
      })
      .filter(num => num >= mapping.base);

    // Find the next available number
    let nextNumber = mapping.base + 1;
    while (existingCodes.includes(nextNumber)) {
      nextNumber++;
    }

    return `${mapping.prefix}${nextNumber}`;
  };

  const ensureLecturerForTrack = async (trackId: string) => {
    // Check if there's already a lecturer for this track
    const existingLecturer = lecturers.find(lecturer => 
      lecturer.academic_tracks?.includes(trackId)
    );
    
    if (existingLecturer) {
      return existingLecturer;
    }

    // Create a new lecturer for this track
    const track = academicTracks.find(t => t.id === trackId);
    if (!track) return null;

    const hebrewNames = [
      'דוד כהן', 'שרה לוי', 'משה אברהם', 'רות דוד', 'יוסף מזרחי',
      'מירי שלום', 'אבי גולד', 'נועה ברק', 'עמית כץ', 'הדר רוזן'
    ];
    
    const titles = ['ד"ר', 'פרופ\'', 'מר', 'גב\''];
    const randomName = hebrewNames[Math.floor(Math.random() * hebrewNames.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    const newLecturer = {
      full_name: `${randomTitle} ${randomName}`,
      email: `lecturer${Date.now()}@ono.ac.il`,
      employee_id: `EMP${Date.now()}`,
      department: track.department,
      specialization: 'התמחות כללית',
      academic_tracks: [trackId],
      status: 'active' as const
    };

    try {
      const createdLecturer = await Lecturer.create(newLecturer);
      // Refresh lecturers list
      const updatedLecturers = await Lecturer.list();
      setLecturers(Array.isArray(updatedLecturers) ? updatedLecturers : []);
      return createdLecturer;
    } catch (error) {
      console.error('Error creating lecturer:', error);
      return null;
    }
  };

  const handleOpenDialog = (course: CourseData | null = null) => {
    setEditingCourse(course);
    if (course) {
      setFormData({
        course_name: course.course_name || course.name || '',
        course_code: course.course_code || course.code || '',
        lecturer_ids: course.lecturer_ids || (course.lecturer_id ? [course.lecturer_id] : []),
        credits: course.credits || 0,
        academic_track_ids: course.academic_track_ids || [],
      });
    } else {
      setFormData({ 
        course_name: '', 
        course_code: '', 
        lecturer_ids: [], 
        credits: 0,
        academic_track_ids: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isCourseCodeUnique = (code: string) => {
    if (!code) return true;
    return !courses.some(course => 
      (course.course_code || course.code) === code && 
      course.id !== editingCourse?.id
    );
  };
  
  const handleSelectChange = (e: ChangeEvent<{ value: unknown }>) => {
    setFormData((prev) => ({ ...prev, lecturer: e.target.value as string }));
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await Course.update(editingCourse.id, formData);
      } else {
        await Course.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Failed to save course:", error);
      alert('שגיאה בשמירת הקורס.');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קורס זה?')) {
      try {
        await Course.delete(courseId);
        loadData();
      } catch (error) {
        console.error("Failed to delete course:", error);
        alert('שגיאה במחיקת הקורס.');
      }
    }
  };

  // Sorting functions
  const handleSort = (field: keyof CourseData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof CourseData) => {
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
      course_name: '',
      course_code: '',
      lecturer: '',
      credits: '',
      academic_tracks: ''
    });
    setTrackFilter('all');
    setSortField('course_name');
    setSortDirection('asc');
  };




  return (
    <Box sx={{ p: 2, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        בחזרה לפאנל הניהול
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><BookOpen /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול קורסים</Typography>
          </Box>
          <Typography color="text.secondary">יצירה, עריכה וניהול של קורסים ושיוך למסלולים אקדמיים</Typography>
        </Box>
        <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
          הוסף קורס חדש
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
          <ToggleButton value="all" aria-label="כל הקורסים">
            כל הקורסים
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
              placeholder="חפש שם קורס..."
              value={filters.course_name}
              onChange={(e) => handleFilterChange('course_name', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              placeholder="חפש קוד קורס..."
              value={filters.course_code}
              onChange={(e) => handleFilterChange('course_code', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              placeholder="חפש מרצה..."
              value={filters.lecturer}
              onChange={(e) => handleFilterChange('lecturer', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              placeholder="חפש נקודות..."
              value={filters.credits}
              onChange={(e) => handleFilterChange('credits', e.target.value)}
              InputProps={{
                startAdornment: <Filter size={16} style={{ marginRight: 8, color: '#6b7280' }} />
              }}
              sx={{ minWidth: 120 }}
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
                    onClick={() => handleSort('course_name')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('course_name')}
                  >
                    שם קורס
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('course_code')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('course_code')}
                  >
                    קוד קורס
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('lecturer_ids')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('lecturer_ids')}
                  >
                    מרצים אחראיים
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <Button
                    onClick={() => handleSort('credits')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('credits')}
                  >
                    נקודות זכות
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
                  <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredCourses) ? filteredCourses : []).map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell align="left">{course.course_name || course.name || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">
                    <Chip 
                      label={course.course_code || course.code || 'לא מוגדר'} 
                      size="small" 
                      icon={<BookOpen color="#2e7d32" size={16} />}
                      sx={{ bgcolor: (course.course_code || course.code) ? '#e8f5e8' : '#ffebee', color: (course.course_code || course.code) ? '#2e7d32' : '#d32f2f', width: "100px" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(() => {
                        // Try to get lecturer IDs from course data
                        const lecturerIds = course.lecturer_ids || (course.lecturer_id ? [course.lecturer_id] : []);
                        
                        if (lecturerIds.length > 0) {
                          return lecturerIds.map((lecturerId: string) => {
                            const lecturerName = lecturersMap[lecturerId];
                            return lecturerName ? (
                              <Chip 
                                key={lecturerId} 
                                label={lecturerName} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                              />
                            ) : null;
                          }).filter(Boolean);
                        } else if (course.lecturer) {
                          // Fallback to legacy lecturer field
                          return [
                            <Chip 
                              key="legacy" 
                              label={course.lecturer} 
                              size="small" 
                              variant="outlined"
                              color="default"
                            />
                          ];
                        } else {
                          return [
                            <Typography key="none" variant="body2" color="text.secondary">
                              לא משויך
                            </Typography>
                          ];
                        }
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell align="left">{course.credits || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(() => {
                        const trackIds = course.academic_track_ids || (course.academic_track ? [course.academic_track] : []);
                        console.log(`Course ${course.id} track IDs:`, trackIds);
                        return trackIds.length > 0 ? 
                          trackIds.map(trackId => {
                            const trackName = academicTracksMap[trackId];
                            if (!trackName) {
                              console.warn(`⚠️ Track ID "${trackId}" not found in academicTracksMap. Run LocalStorageUtils.refreshAllData() to fix.`);
                              return <Chip key={trackId} label={`${trackId} (נדרש רענון)`} size="small" color="warning" />;
                            }
                            return <Chip key={trackId} label={trackName} size="small" icon={<GraduationCap />} />;
                          }) : 
                          <Typography variant="body2" color="text.secondary">אין מסלולים</Typography>;
                      })()}
                    </Box>
                  </TableCell>
                  <TableCell align="left">
                    <IconButton onClick={() => handleOpenDialog(course)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(course.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingCourse ? 'עריכת קורס' : 'הוספת קורס חדש'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField name="course_name" label="שם הקורס" value={formData.course_name} onChange={handleFormChange} required fullWidth />
            <TextField 
              name="course_code" 
              label="קוד קורס" 
              value={formData.course_code} 
              onChange={handleFormChange} 
              required 
              fullWidth
              InputProps={{
                readOnly: !formData.course_code && !editingCourse, // Read-only until auto-generated (except when editing)
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (!formData.course_code && !editingCourse) ? '#ff9800' : undefined,
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: (!formData.course_code && !editingCourse) ? '#ff9800' : undefined,
                  },
                },
              }}
              error={Boolean(formData.course_code && !isCourseCodeUnique(formData.course_code))}
              helperText={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {formData.course_code && !isCourseCodeUnique(formData.course_code) ? (
                    <>
                      <X size={16} style={{ color: '#f44336' }} />
                      <span>קוד קורס זה כבר קיים במערכת</span>
                    </>
                  ) : !formData.course_code && !editingCourse ? (
                    <>
                      <Lock size={16} style={{ color: '#ff9800' }} />
                      <span>קוד הקורס יתמלא אוטומטית לאחר בחירת מסלול אקדמי</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={16} style={{ color: '#4caf50' }} />
                      <span>ניתן לערוך את קוד הקורס לפי הצורך</span>
                    </>
                  )}
                </Box>
              }
              placeholder="יתמלא אוטומטית..."
            />
            {/* Academic Track Selection */}
            <Autocomplete
              multiple
              options={academicTracks}
              getOptionLabel={(option) => option.name}
              value={academicTracks.filter(track => formData.academic_track_ids.includes(track.id))}
              onChange={async (_, newValues) => {
                if (newValues.length > 0) {
                  // Ensure there's a lecturer for each track
                  for (const track of newValues) {
                    await ensureLecturerForTrack(track.id);
                  }
                  
                  // Generate course code based on the first (primary) track
                  const primaryTrackId = newValues[0].id;
                  const newCourseCode = generateCourseCode(primaryTrackId, courses);
                  
                  setFormData(prev => ({
                    ...prev,
                    academic_track_ids: newValues.map(track => track.id),
                    course_code: newCourseCode,
                    lecturer_ids: [] // Reset lecturers when tracks change
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    academic_track_ids: [],
                    course_code: '',
                    lecturer_ids: []
                  }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="מסלולים אקדמיים" required fullWidth />
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
            />

            {/* Lecturer Selection - always visible but disabled until tracks are selected */}
            <Autocomplete
              multiple
              disabled={formData.academic_track_ids.length === 0}
              options={formData.academic_track_ids.length > 0 ? lecturers.filter(lecturer => 
                lecturer.academic_tracks?.some((track: string) => 
                  formData.academic_track_ids.includes(track)
                )
              ) : []}
              getOptionLabel={(option) => `${option.full_name} (${option.department})`}
              value={lecturers.filter(lecturer => formData.lecturer_ids.includes(lecturer.id))}
              onChange={(_, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  lecturer_ids: newValue.map(lecturer => lecturer.id)
                }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="מרצים אחראיים" 
                  required 
                  fullWidth
                  helperText={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {formData.academic_track_ids.length === 0 ? (
                        <>
                          <Lock size={16} style={{ color: '#ff9800' }} />
                          <span>בחר מסלול אקדמי תחילה כדי לראות מרצים זמינים</span>
                        </>
                      ) : formData.academic_track_ids.length > 0 && lecturers.filter(lecturer => 
                          lecturer.academic_tracks?.some((track: string) => 
                            formData.academic_track_ids.includes(track)
                          )
                        ).length === 0 ? (
                        <>
                          <AlertTriangle size={16} style={{ color: '#ff9800' }} />
                          <span>אין מרצים זמינים למסלולים הנבחרים. המערכת תיצור מרצה חדש אוטומטית.</span>
                        </>
                      ) : (
                        <>
                          <span>בחר מרצים אחראיים לקורס</span>
                        </>
                      )}
                    </Box>
                  }
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.full_name}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              noOptionsText={
                formData.academic_track_ids.length === 0 
                  ? "בחר מסלול אקדמי תחילה"
                  : "אין מרצים זמינים למסלולים הנבחרים"
              }
            />
            <TextField 
              name="credits" 
              label="נקודות זכות (1-10)" 
              type="number" 
              value={formData.credits} 
              onChange={handleFormChange} 
              required 
              fullWidth
              inputProps={{ min: 1, max: 10, step: 1 }}
              error={formData.credits < 1 || formData.credits > 10}
              helperText={formData.credits < 1 || formData.credits > 10 ? 'נקודות זכות חייבות להיות בין 1-10' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!isFormValid}
          >
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
