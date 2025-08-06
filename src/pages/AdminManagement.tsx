
import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import {
    Button, TextField, Table, TableBody, TableCell, TableHead,
    TableRow, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Paper, IconButton, Chip, Select, MenuItem, InputLabel, FormControl,
    Avatar
} from '@mui/material';
import { Settings, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'admin',
    current_role: 'admin'
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      // Load all users with admin role
      const allUsers = await User.list();
      const adminUsers = allUsers.filter((user: User) => user.roles.includes('admin'));
      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  };

  const handleAdd = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'admin',
      current_role: 'admin'
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (admin: User) => {
    setSelectedAdmin(admin);
    setFormData({
      full_name: admin.full_name || '',
      email: admin.email || '',
      role: admin.roles.includes('admin') ? 'admin' : 'user',
      current_role: admin.current_role || 'admin'
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedAdmin) {
        await User.update(selectedAdmin.id, formData);
      } else {
        await User.create(formData);
      }
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (error) {
      console.error("Error saving admin:", error);
      alert("שגיאה בשמירת המנהל");
    }
  };

  const handleDelete = async (adminId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק מנהל זה?")) {
      try {
        await User.delete(adminId);
        loadAdmins();
      } catch (error) {
        console.error("Error deleting admin:", error);
        alert("שגיאה במחיקת המנהל");
      }
    }
  };

  const getRoleChip = (currentRole: string) => {
    const roleText = currentRole === 'admin' ? 'מנהל פעיל' :
                     currentRole === 'lecturer' ? 'מרצה פעיל' :
                     currentRole === 'student' ? 'סטודנט פעיל' : 'מנהל';

    const color = currentRole === 'admin' ? 'error' :
                   currentRole === 'lecturer' ? 'primary' :
                   currentRole === 'student' ? 'success' : 'default';

    return <Chip label={roleText} color={color} size="small" />;
  };

  return (
    <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button component={Link} to={createPageUrl("AdminPanel")} variant="outlined" startIcon={<ArrowRight />} sx={{ mb: 3 }}>
        בחזרה לפאנל הניהול
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}><Settings /></Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">ניהול מנהלים</Typography>
            <Typography color="text.secondary">ניהול מנהלי המערכת והרשאותיהם</Typography>
          </Box>
        </Box>
        <Button onClick={handleAdd} variant="contained" startIcon={<Plus />}>
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
                <TableCell>תפקיד נוכחי</TableCell>
                <TableCell>תאריך הצטרפות</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin: User) => (
                <TableRow key={admin.id} hover>
                  <TableCell>{admin.full_name || 'לא מוגדר'}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{getRoleChip(admin.current_role)}</TableCell>
                  <TableCell align="left">
                    <IconButton onClick={() => handleEdit(admin)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(admin.id)} color="error"><Trash2 /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onClose={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>
        <DialogTitle>{selectedAdmin ? 'ערוך מנהל' : 'הוסף מנהל חדש'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="שם מלא"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="כתובת מייל"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!selectedAdmin}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>תפקיד נוכחי</InputLabel>
              <Select
                value={formData.current_role}
                label="תפקיד נוכחי"
                onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
              >
                <MenuItem value="admin">מנהל</MenuItem>
                <MenuItem value="lecturer">מרצה</MenuItem>
                <MenuItem value="student">סטודנט</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>ביטול</Button>
          <Button onClick={handleSave} variant="contained">שמור</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
