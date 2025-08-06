
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Student, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar
} from '@mui/material';
import { Users, Plus, Edit, Trash2, ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type StudentData = {
  id: string;
  full_name: string;
  student_id: string;
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
  student_id: string;
  email: string;
  academic_track_ids: string[];
};

export default function AdminStudentManagement() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    student_id: '',
    email: '',
    academic_track_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentList, trackList] = await Promise.all([
        Student.list(),
        AcademicTrack.list()
      ]);
      setStudents(studentList);
      setAcademicTracks(trackList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (student: StudentData | null = null) => {
    setEditingStudent(student);
    if (student) {
      setFormData({
        full_name: student.full_name,
        student_id: student.student_id,
        email: student.email,
        academic_track_ids: student.academic_track_ids || [],
      });
    } else {
      setFormData({ full_name: '', student_id: '', email: '', academic_track_ids: [] });
    }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await Student.update(editingStudent.id, formData);
      } else {
        await Student.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Failed to save student:", error);
      alert('שגיאה בשמירת הסטודנט.');
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
  
  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc: { [key: string]: string }, track: AcademicTrackData) => {
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
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><Users /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול סטודנטים</Typography>
          </Box>
          <Typography color="text.secondary">הוספה, עריכה ומחיקה של סטודנטים רשומים</Typography>
        </Box>
        <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
          הוסף סטודנט חדש
        </Button>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>שם מלא</TableCell>
                <TableCell>מספר ת.ז</TableCell>
                <TableCell>כתובת מייל</TableCell>
                <TableCell>מסלול אקדמי</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(student.academic_track_ids || []).map(trackId => (
                        <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                      ))}
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

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingStudent ? 'עריכת סטודנט' : 'הוספת סטודנט חדש'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField name="full_name" label="שם מלא" value={formData.full_name} onChange={handleFormChange} required fullWidth />
            <TextField name="student_id" label="מספר ת.ז" value={formData.student_id} onChange={handleFormChange} required fullWidth />
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
