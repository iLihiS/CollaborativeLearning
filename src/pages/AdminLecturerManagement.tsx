
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Lecturer, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { GraduationCap, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type LecturerData = {
  id: string;
  full_name: string;
  email: string;
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
  academic_track_ids: string[];
};

export default function AdminLecturerManagement() {
  const [lecturers, setLecturers] = useState<LecturerData[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<LecturerData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<LecturerData | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    academic_track_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (trackFilter === 'all') {
      setFilteredLecturers(lecturers);
    } else {
      setFilteredLecturers(lecturers.filter(lecturer => 
        lecturer.academic_track_ids && lecturer.academic_track_ids.includes(trackFilter)
      ));
    }
  }, [trackFilter, lecturers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lecturerList, trackList] = await Promise.all([
        Lecturer.list(),
        AcademicTrack.list()
      ]);
      const validLecturers = Array.isArray(lecturerList) ? lecturerList : [];
      setLecturers(validLecturers);
      setFilteredLecturers(validLecturers);
      setAcademicTracks(Array.isArray(trackList) ? trackList : []);
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
        academic_track_ids: lecturer.academic_track_ids || [],
      });
    } else {
      setFormData({ full_name: '', email: '', academic_track_ids: [] });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLecturer(null);
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

  const getShortTrackName = (trackName: string) => {
    // החזרת השמות המלאים במקום קיצורים
    return trackName;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingLecturer) {
        await Lecturer.update(editingLecturer.id, formData);
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
  
  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc: { [key: string]: string }, track: AcademicTrackData) => {
    if (track) acc[track.id] = track.name;
    return acc;
  }, {});

  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
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
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">שם מלא</TableCell>
                <TableCell align="left">כתובת מייל</TableCell>
                <TableCell align="left">מסלולים אקדמיים</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredLecturers) ? filteredLecturers : []).map((lecturer) => (
                <TableRow key={lecturer.id} hover>
                  <TableCell align="left">{lecturer.full_name || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">{lecturer.email || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(lecturer.academic_track_ids && lecturer.academic_track_ids.length > 0) ? 
                        lecturer.academic_track_ids.map(trackId => (
                          <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                        )) : 
                        <Typography variant="body2" color="text.secondary">אין מסלולים</Typography>
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
        <DialogTitle>{editingLecturer ? 'עריכת מרצה' : 'הוספת מרצה חדש'}</DialogTitle>
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
