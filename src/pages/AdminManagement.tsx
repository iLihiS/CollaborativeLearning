
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { User, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Checkbox, FormControlLabel, FormGroup, Box, Typography, Paper,
    IconButton, CircularProgress, Chip, Avatar
} from '@mui/material';
import { Shield, Plus, Edit, Trash2, ArrowRight, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type AdminData = {
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

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [academicTracks, setAcademicTracks] = useState<AcademicTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
      const [adminList, trackList] = await Promise.all([
        User.list(),
        AcademicTrack.list()
      ]);
      // Filter only admin users
      const filteredAdmins = Array.isArray(adminList) ? adminList.filter((user: any) => user.roles && user.roles.includes('admin')) : [];
      setAdmins(filteredAdmins);
      setAcademicTracks(Array.isArray(trackList) ? trackList : []);
    } catch (error) {
      console.error("Error loading data:", error);
      setAdmins([]);
      setAcademicTracks([]);
    }
    setLoading(false);
  };

  const handleOpenDialog = (admin: AdminData | null = null) => {
    setEditingAdmin(admin);
    if (admin) {
      setFormData({
        full_name: admin.full_name,
        email: admin.email,
        academic_track_ids: admin.academic_track_ids || [],
      });
    } else {
      setFormData({ full_name: '', email: '', academic_track_ids: [] });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
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
      if (editingAdmin) {
        await User.update(editingAdmin.id, formData);
      } else {
        await User.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Failed to save admin:", error);
      alert('שגיאה בשמירת המנהל.');
    }
  };

  const handleDelete = async (adminId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מנהל זה?')) {
      try {
        await User.delete(adminId);
        loadData();
      } catch (error) {
        console.error("Failed to delete admin:", error);
        alert('שגיאה במחיקת המנהל.');
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
        בחזרה לפאנל הניהול
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}><Shield /></Avatar>
            <Typography variant="h4" fontWeight="bold">ניהול מנהלים</Typography>
          </Box>
          <Typography color="text.secondary">יצירה, עריכה וניהול של מנהלי המערכת</Typography>
        </Box>
        <Button onClick={() => handleOpenDialog()} variant="contained" startIcon={<Plus />}>
          הוסף מנהל חדש
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
              ) : (Array.isArray(admins) ? admins : []).map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell>{admin.full_name || 'לא מוגדר'}</TableCell>
                  <TableCell>{admin.email || 'לא מוגדר'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(admin.academic_track_ids && admin.academic_track_ids.length > 0) ? 
                        admin.academic_track_ids.map(trackId => (
                          <Chip key={trackId} label={tracksMap[trackId] || trackId} size="small" icon={<GraduationCap />} />
                        )) : 
                        <Typography variant="body2" color="text.secondary">אין מסלולים</Typography>
                      }
                    </Box>
                  </TableCell>
                  <TableCell align="left">
                    <IconButton onClick={() => handleOpenDialog(admin)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(admin.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingAdmin ? 'עריכת מנהל' : 'הוספת מנהל חדש'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField name="full_name" label="שם מלא" value={formData.full_name} onChange={handleFormChange} required fullWidth />
            <TextField name="email" label="כתובת מייל" type="email" value={formData.email} onChange={handleFormChange} required fullWidth />
            
            <FormGroup>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>מסלולים אקדמיים</Typography>
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
