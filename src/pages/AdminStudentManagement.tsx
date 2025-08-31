
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Student, AcademicTrack } from '@/api/entities';
import { FormValidator } from '@/utils/validation';
import { LocalStorageService } from '@/services/localStorage';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar, ToggleButtonGroup, ToggleButton,
    Alert
} from '@mui/material';
import { Users, Plus, Edit, Trash2, ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type StudentData = {
  id: string;
  full_name: string;
  student_id: string;
  national_id?: string;
  email: string;
  academic_track_ids: string[];
};

type AcademicTrackData = {
  id: string;
  name: string;
  department: string;
  degree_type: string;
};

type FormData = {
  full_name: string;
  student_id: string;
  national_id?: string;
  email: string;
  academic_track_ids: string[];
};

type FormErrors = {
  full_name?: string;
  student_id?: string;
  national_id?: string;
  email?: string;
  academic_track_ids?: string;
  general?: string;
};

export default function AdminStudentManagement() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [trackFilter, setTrackFilter] = useState('all');
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    student_id: '',
    national_id: '',
    email: '',
    academic_track_ids: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (trackFilter === 'all') {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(students.filter(student => 
        student.academic_track_ids && student.academic_track_ids.includes(trackFilter)
      ));
    }
  }, [trackFilter, students]);

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
      setStudents(validStudents);
      setFilteredStudents(validStudents);
      setAcademicTracks(validTracks);
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

  const handleOpenDialog = (student: StudentData | null = null) => {
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
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><Users /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול סטודנטים</Typography>
          </Box>
          <Typography color="text.secondary">הוספה, עריכה ומחיקה של סטודנטים רשומים</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            onClick={() => {
              LocalStorageService.removeDuplicateStudents();
              loadData();
              alert('כפילויות וסטודנטים לא תקינים הוסרו בהצלחה!');
            }} 
            variant="outlined" 
            color="warning"
            startIcon={<Trash2 />}
            size="small"
          >
            נקה כפילויות
          </Button>
          <Button 
            onClick={() => {
              LocalStorageService.removeStudentsWithoutNationalId();
              loadData();
              alert('סטודנטים ללא תעודת זהות הוסרו בהצלחה!');
            }} 
            variant="outlined" 
            color="error"
            startIcon={<Trash2 />}
            size="small"
          >
            הסר ללא ת.ז
          </Button>
          <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
            הוסף סטודנט חדש
          </Button>
        </Box>
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
          <ToggleButton value="all" aria-label="כל הסטודנטים">
            כל הסטודנטים
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
                <TableCell align="left">מספר סטודנט</TableCell>
                <TableCell align="left">תעודת זהות</TableCell>
                <TableCell align="left">כתובת מייל</TableCell>
                <TableCell align="left">מסלול אקדמי</TableCell>
                <TableCell align="left">פעולות</TableCell>
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
                  <TableCell align="left">{student.student_id || 'לא מוגדר'}</TableCell>
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
        <DialogTitle>{editingStudent ? 'עריכת סטודנט' : 'הוספת סטודנט חדש'}</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {formErrors.general && (
              <Alert severity="error" sx={{ mb: 2 }}>
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
              label="תעודת זהות *" 
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


            <FormGroup>
              <Typography component="legend" variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                מסלולים אקדמיים
              </Typography>
              
              {academicTracks.length === 0 ? (
                <Typography color="error" sx={{ mb: 2 }}>
                  🔄 טוען מסלולים אקדמיים...
                </Typography>
              ) : (
                <Box sx={{ 
                  maxHeight: 300, 
                  overflowY: 'auto', 
                  border: 2, 
                  borderColor: 'primary.main', 
                  borderRadius: 2, 
                  p: 2,
                  backgroundColor: 'grey.50'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    בחר מסלול אקדמי או יותר עבור הסטודנט:
                  </Typography>
                  
                  {academicTracks.map(track => (
                    <FormControlLabel
                      key={track.id}
                      sx={{ 
                        display: 'block', 
                        mb: 1,
                        p: 1,
                        border: 1,
                        borderColor: formData.academic_track_ids.includes(track.id) ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        backgroundColor: formData.academic_track_ids.includes(track.id) ? 'primary.50' : 'white',
                        '&:hover': {
                          backgroundColor: 'grey.100'
                        }
                      }}
                      control={
                        <Checkbox
                          checked={formData.academic_track_ids.includes(track.id)}
                          onChange={() => handleTrackToggle(track.id)}
                          name={track.id}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {track.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {track.department} • {track.degree_type}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </Box>
              )}
              
              {formErrors.academic_track_ids && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {formErrors.academic_track_ids}
                </Alert>
              )}
              
              {formData.academic_track_ids.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="primary">
                    ✅ נבחרו {formData.academic_track_ids.length} מסלולים
                  </Typography>
                </Box>
              )}
            </FormGroup>
          </Box>
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
    </Box>
  );
}
