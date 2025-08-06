
import { useState, useEffect } from 'react';
import { Lecturer, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar
} from '@mui/material';
import { GraduationCap, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminLecturerManagement() {
  const [lecturers, setLecturers] = useState([]);
  const [academicTracks, setAcademicTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLecturer, setCurrentLecturer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    academic_track_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lecturerList, trackList] = await Promise.all([
        Lecturer.list(),
        AcademicTrack.list()
      ]);
      setLecturers(lecturerList);
      setAcademicTracks(trackList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (lecturer = null) => {
    setCurrentLecturer(lecturer);
    if (lecturer) {
      setFormData({
        full_name: lecturer.full_name,
        email: lecturer.email,
        academic_track_ids: lecturer.academic_track_ids || [],
      });
    } else {
      setFormData({ 
        full_name: '', 
        email: '', 
        academic_track_ids: [] 
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentLecturer(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (currentLecturer) {
        await Lecturer.update(currentLecturer.id, formData);
      } else {
        await Lecturer.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Failed to save lecturer:", error);
      alert('שגיאה בשמירת המרצה.');
    }
  };

  const handleDelete = async (lecturerId) => {
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
  
  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc, track) => {
    if (track) acc[track.id] = track.name;
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
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><GraduationCap /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול מרצים</Typography>
          </Box>
          <Typography color="text.secondary">הוספה, עריכה וניהול של סגל המרצים</Typography>
        </Box>
        <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
          הוסף מרצה חדש
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם מלא</TableCell>
                <TableCell>כתובת מייל</TableCell>
                <TableCell>מסלולים אקדמיים</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : lecturers.map((lecturer) => (
                <TableRow key={lecturer.id} hover>
                  <TableCell>{lecturer.full_name}</TableCell>
                  <TableCell>{lecturer.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(lecturer.academic_track_ids || []).map(trackId => (
                        <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                      ))}
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
        <DialogTitle>{currentLecturer ? 'עריכת מרצה' : 'הוספת מרצה חדש'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField name="full_name" label="שם מלא" value={formData.full_name} onChange={handleFormChange} required fullWidth />
            <TextField name="email" type="email" label="אימייל" value={formData.email} onChange={handleFormChange} required fullWidth />
            <FormGroup>
              <Typography component="legend" variant="body1" sx={{ mb: 1 }}>מסלולים אקדמיים</Typography>
              <Box sx={{ maxHeight: 150, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
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
              </Box>
            </FormGroup>
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
