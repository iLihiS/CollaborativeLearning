import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Course, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar, Select, MenuItem, FormControl, InputLabel,
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { BookOpen, Plus, Edit, Trash2, ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type CourseData = {
  id: string;
  course_name: string;
  course_code: string;
  lecturer: string;
  credits: number;
  academic_track_ids: string[];
};

type AcademicTrackData = {
  id: string;
  name: string;
  department: string;
};

type FormData = {
  course_name: string;
  course_code: string;
  lecturer: string;
  credits: number;
  academic_track_ids: string[];
};

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [formData, setFormData] = useState<FormData>({
    course_name: '',
    course_code: '',
    lecturer: '',
    credits: 0,
    academic_track_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (trackFilter === 'all') {
      setFilteredCourses(courses);
    } else {
      setFilteredCourses(courses.filter(course => 
        course.academic_track_ids && course.academic_track_ids.includes(trackFilter)
      ));
    }
  }, [trackFilter, courses]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseList, trackList] = await Promise.all([
        Course.list(),
        AcademicTrack.list()
      ]);
      console.log('Courses loaded:', courseList);
      console.log('Academic tracks in courses:', trackList);
      const validCourses = Array.isArray(courseList) ? courseList : [];
      setCourses(validCourses);
      setFilteredCourses(validCourses);
      setAcademicTracks(Array.isArray(trackList) ? trackList : []);
    } catch (error) {
      console.error("Error loading data:", error);
      setCourses([]);
      setFilteredCourses([]);
      setAcademicTracks([]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course: CourseData | null = null) => {
    setEditingCourse(course);
    if (course) {
      setFormData({
        course_name: course.course_name,
        course_code: course.course_code,
        lecturer: course.lecturer,
        credits: course.credits,
        academic_track_ids: course.academic_track_ids || [],
      });
    } else {
      setFormData({ 
        course_name: '', 
        course_code: '', 
        lecturer: '', 
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
    // החזרת השמות המלאים במקום קיצורים
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

  const academicTracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc: { [key: string]: string }, track: AcademicTrackData) => {
    if(track) acc[track.id] = track.name;
    return acc;
  }, {});

  const lecturersMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc: { [key: string]: string }, track: AcademicTrackData) => {
    if(track) acc[track.id] = track.name;
    return acc;
  }, {});


  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
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
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם קורס</TableCell>
                <TableCell>קוד קורס</TableCell>
                <TableCell>מרצה אחראי</TableCell>
                <TableCell>נקודות זכות</TableCell>
                <TableCell>מסלולים אקדמיים</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredCourses) ? filteredCourses : []).map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>{course.course_name || 'לא מוגדר'}</TableCell>
                  <TableCell>{course.course_code || 'לא מוגדר'}</TableCell>
                  <TableCell>{course.lecturer || 'לא משויך'}</TableCell>
                  <TableCell>{course.credits || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(course.academic_track_ids && course.academic_track_ids.length > 0) ? 
                        course.academic_track_ids.map(trackId => (
                          <Chip key={trackId} label={academicTracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                        )) : 
                        <Typography variant="body2" color="text.secondary">אין מסלולים</Typography>
                      }
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
            <TextField name="course_code" label="קוד קורס" value={formData.course_code} onChange={handleFormChange} required fullWidth />
            <TextField name="lecturer" label="מרצה אחראי" value={formData.lecturer} onChange={handleFormChange} required fullWidth />
            <TextField name="credits" label="נקודות זכות" type="number" value={formData.credits} onChange={handleFormChange} required fullWidth />
            <FormControl component="fieldset" fullWidth>
              <Typography component="legend" variant="body1" sx={{ mb: 1 }}>מסלולים אקדמיים</Typography>
              <FormGroup>
                {(Array.isArray(academicTracks) ? academicTracks : []).map(track => (
                  track && <FormControlLabel
                    key={track.id}
                    control={
                      <Checkbox
                        checked={formData.academic_track_ids.includes(track.id)}
                        onChange={() => handleTrackToggle(track.id)}
                        name={track.id}
                      />
                    }
                    label={`${track.name} (${track.department})`}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleSubmit} variant="contained">שמור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
