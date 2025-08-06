import { useState, useEffect } from 'react';
import { Course, Lecturer, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Select, MenuItem, Checkbox, FormControlLabel, FormGroup, InputLabel, FormControl,
    Box, Typography, Paper, IconButton, CircularProgress, Avatar, Chip
} from '@mui/material';
import { Book, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [academicTracks, setAcademicTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    lecturer_id: '',
    semester: '',
    description: '',
    academic_track_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseList, lecturerList, trackList] = await Promise.all([
        Course.list(), 
        Lecturer.list(),
        AcademicTrack.list()
      ]);
      setCourses(courseList);
      setLecturers(lecturerList);
      setAcademicTracks(trackList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course = null) => {
    setCurrentCourse(course);
    if (course) {
      setFormData({
        course_name: course.course_name,
        course_code: course.course_code,
        lecturer_id: course.lecturer_id,
        semester: course.semester,
        description: course.description || '',
        academic_track_ids: course.academic_track_ids || [],
      });
    } else {
      setFormData({ 
        course_name: '', 
        course_code: '', 
        lecturer_id: '', 
        semester: '', 
        description: '',
        academic_track_ids: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentCourse(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (e) => {
    setFormData((prev) => ({ ...prev, lecturer_id: e.target.value }));
  };

  const handleTrackToggle = (trackId) => {
    setFormData((prev) => ({
      ...prev,
      academic_track_ids: prev.academic_track_ids.includes(trackId)
        ? prev.academic_track_ids.filter(id => id !== trackId)
        : [...prev.academic_track_ids, trackId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCourse) {
        await Course.update(currentCourse.id, formData);
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

  const handleDelete = async (courseId) => {
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

  const lecturersMap = (Array.isArray(lecturers) ? lecturers : []).reduce((acc, lec) => {
    if(lec) acc[lec.id] = lec.full_name;
    return acc;
  }, {});

  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc, track) => {
    if(track) acc[track.id] = track.name;
    return acc;
  }, {});



  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        חזרה לפאנל הניהול
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><Book /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול קורסים</Typography>
          </Box>
          <Typography color="text.secondary">יצירה, עריכה וניהול של קורסים ושיוך למסלולים אקדמיים</Typography>
        </Box>
        <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
          הוסף קורס חדש
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם קורס</TableCell>
                <TableCell>קוד קורס</TableCell>
                <TableCell>מרצה אחראי</TableCell>
                <TableCell>מסלולים אקדמיים</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : courses.map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>{course.course_name}</TableCell>
                  <TableCell>{course.course_code}</TableCell>
                  <TableCell>{lecturersMap[course.lecturer_id] || 'לא משויך'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(course.academic_track_ids || []).map(trackId => (
                        <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" />
                      ))}
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
        <DialogTitle>{currentCourse ? 'עריכת קורס' : 'הוספת קורס חדש'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField name="course_name" label="שם הקורס" value={formData.course_name} onChange={handleFormChange} required fullWidth />
            <TextField name="course_code" label="קוד קורס" value={formData.course_code} onChange={handleFormChange} required fullWidth />
            <TextField name="semester" label="סמסטר" value={formData.semester} onChange={handleFormChange} required fullWidth />
            <FormControl fullWidth>
              <InputLabel id="lecturer-select-label">מרצה</InputLabel>
              <Select labelId="lecturer-select-label" name="lecturer_id" value={formData.lecturer_id} label="מרצה" onChange={handleSelectChange}>
                {(Array.isArray(lecturers) ? lecturers : []).map(lecturer => (
                  lecturer && <MenuItem key={lecturer.id} value={lecturer.id}>{lecturer.full_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl component="fieldset" fullWidth>
              <Typography component="legend" variant="body1" sx={{ mb: 1 }}>מסלולים אקדמיים</Typography>
              <FormGroup sx={{ maxHeight: 150, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
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
            <TextField name="description" label="תיאור" value={formData.description} onChange={handleFormChange} multiline rows={3} fullWidth />
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
