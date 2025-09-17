
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { User, AcademicTrack } from '@/api/entities';
import {
    Button, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogContent, DialogTitle, DialogActions, TextField,
    Box, Typography, Paper, IconButton, CircularProgress, Chip, Avatar, 
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { Shield, Plus, Edit, Trash2, ArrowRight, ChevronUp, ChevronDown, Filter, X, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils'
import AdminDesktopGuard from '@/components/AdminDesktopGuard';

type AdminData = {
  id: string;
  full_name: string;
  email: string;
  admin_id?: string;
};

type FormData = {
  full_name: string;
  email: string;
  admin_id: string;
};

type FormErrors = {
  full_name?: string;
  email?: string;
  admin_id?: string;
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    admin_id: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isAdminIdEditable, setIsAdminIdEditable] = useState(false);

  // Sorting and filtering state
  const [sortField, setSortField] = useState<keyof AdminData | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{
    full_name: string;
    email: string;
    admin_id: string;
  }>({
    full_name: '',
    email: '',
    admin_id: ''
  });

  useEffect(() => {
    loadData();
    // Set default sorting on initial load
    setSortField('full_name');
    setSortDirection('asc');
  }, []);

  useEffect(() => {
    let filtered = admins;
    
    // Column filters
    if (filters.full_name) {
      filtered = filtered.filter(admin => 
        (admin.full_name || '').toLowerCase().includes(filters.full_name.toLowerCase())
      );
    }
    
    if (filters.email) {
      filtered = filtered.filter(admin => 
        (admin.email || '').toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    
    if (filters.admin_id) {
      filtered = filtered.filter(admin => 
        (admin.admin_id || '').toLowerCase().includes(filters.admin_id.toLowerCase())
      );
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
          case 'admin_id':
            aValue = a.admin_id || '';
            bValue = b.admin_id || '';
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
      
      // Tertiary sort: Admin ID (alphabetical)
      const aId = a.admin_id || '';
      const bId = b.admin_id || '';
      return aId.localeCompare(bId, 'he');
    });
    
    setFilteredAdmins(filtered);
  }, [admins, filters, sortField, sortDirection]);

  // Auto-generate admin ID for new admins
  useEffect(() => {
    if (!editingAdmin && !formData.admin_id && !isAdminIdEditable) {
      const generatedId = generateAdminId();
      setFormData(prev => ({ ...prev, admin_id: generatedId }));
      setIsAdminIdEditable(true);
    }
  }, [formData.full_name, editingAdmin, isAdminIdEditable, admins]);

  // Validate form
  useEffect(() => {
    const isValid = 
      formData.full_name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.admin_id.trim() !== '' &&
      isAdminIdUnique(formData.admin_id);
    
    setIsFormValid(isValid);
  }, [formData, editingAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const adminList = await User.list();
      console.log('📊 All users loaded:', adminList);
      console.log('📊 Total users count:', adminList?.length || 0);
      
      // Filter only admin users and fix missing admin_ids
      const filteredAdmins = Array.isArray(adminList) ? 
        adminList.filter((user: any) => {
          console.log(`👤 User: ${user.full_name}, Roles: ${JSON.stringify(user.roles)}`);
          return user.roles && user.roles.includes('admin');
        }) : [];
      
      console.log('🛡️ Filtered admins:', filteredAdmins);
      console.log('🛡️ Admin count:', filteredAdmins.length);
      
      // If no admins exist, create a default admin
      if (filteredAdmins.length === 0) {
        console.log('⚠️ No admins found, creating default admin...');
        const defaultAdmin = {
          id: 'admin-default-001',
          full_name: 'מנהל ראשי',
          email: 'admin@ono.ac.il',
          roles: ['admin'],
          admin_id: 'ADM0001'
        };
        
        // Add to localStorage
        const currentUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
        currentUsers.push(defaultAdmin);
        localStorage.setItem('mock_users', JSON.stringify(currentUsers));
        
        filteredAdmins.push(defaultAdmin);
        console.log('✅ Created default admin');
      }
      
      // Fix admins without admin_id
      const fixedAdmins = filteredAdmins.map((admin: AdminData) => {
        if (!admin.admin_id) {
          const generatedId = generateAdminId();
          console.log(`⚠️ Fixing admin ${admin.full_name} - assigning admin ID: ${generatedId}`);
          return { ...admin, admin_id: generatedId };
        }
        return admin;
      });
      
      // Update localStorage if any admins were fixed
      const hasChanges = fixedAdmins.some((admin, index) => 
        filteredAdmins[index] && admin.admin_id !== filteredAdmins[index].admin_id
      );
      
      if (hasChanges) {
        // Update admins in localStorage
        const currentData = JSON.parse(localStorage.getItem('mock_users') || '[]');
        const updatedData = currentData.map((user: any) => {
          const fixedAdmin = fixedAdmins.find((a: AdminData) => a.id === user.id);
          return fixedAdmin || user;
        });
        localStorage.setItem('mock_users', JSON.stringify(updatedData));
        console.log('✅ Fixed admins without admin IDs in localStorage');
      }
      
      console.log('✅ Final admins to display:', fixedAdmins);
      setAdmins(fixedAdmins);
      setFilteredAdmins(fixedAdmins);
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setAdmins([]);
      setFilteredAdmins([]);
    }
    setLoading(false);
  };

  const generateAdminId = () => {
    const existingIds = admins
      .map(a => a.admin_id)
      .filter(id => id && id.startsWith('ADM'))
      .map(id => {
        const match = id?.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      });
    
    const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    return `ADM${nextNumber.toString().padStart(4, '0')}`;
  };

  const isAdminIdUnique = (id: string) => {
    if (!id.trim()) return false;
    return !admins.some(a => a.admin_id?.toLowerCase() === id.toLowerCase() && a.id !== editingAdmin?.id);
  };

  const handleOpenDialog = (admin: AdminData | null = null) => {
    setEditingAdmin(admin);
    if (admin) {
      setFormData({
        full_name: admin.full_name,
        email: admin.email,
        admin_id: admin.admin_id || '',
      });
      setIsAdminIdEditable(!!admin.admin_id);
    } else {
      setFormData({ 
        full_name: '', 
        email: '', 
        admin_id: ''
      });
      setIsAdminIdEditable(false);
    }
    setFormErrors({});
    setIsFormValid(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
    setFormErrors({});
    setIsFormValid(false);
    setIsAdminIdEditable(false);
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
    
    if (!formData.admin_id.trim()) {
      errors.admin_id = 'מספר מנהל הוא שדה חובה';
    } else if (!isAdminIdUnique(formData.admin_id)) {
      errors.admin_id = 'מספר מנהל זה כבר קיים במערכת';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const adminData = {
        ...formData,
        roles: ['admin'], // Ensure admin role
        // Admins are automatically associated with all academic tracks
        academic_track_ids: [] // Empty array since admins don't need specific tracks
      };
      
      if (editingAdmin) {
        await User.update(editingAdmin.id, adminData);
      } else {
        await User.create(adminData);
      }
      handleCloseDialog();
      loadData();
      alert('המנהל נשמר בהצלחה!');
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

  // Sorting functions
  const handleSort = (field: keyof AdminData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof AdminData) => {
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
      admin_id: ''
    });
    setSortField('full_name');
    setSortDirection('asc');
  };

  return (
    <AdminDesktopGuard pageName="ניהול מנהלים">
      <Box sx={{ p: 2, bgcolor: 'var(--bg-primary)', minHeight: '100vh' }}>
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

      <Box sx={{ mb: 3 }}>
        {/* Filter Row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
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
              placeholder="חפש מספר מנהל..."
              value={filters.admin_id}
              onChange={(e) => handleFilterChange('admin_id', e.target.value)}
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
                    onClick={() => handleSort('admin_id')}
                    sx={{ 
                      fontWeight: 'bold', 
                      textTransform: 'none', 
                      minWidth: 'auto',
                      p: 0,
                      color: 'text.primary',
                      '&:hover': { backgroundColor: 'transparent' }
                    }}
                    endIcon={getSortIcon('admin_id')}
                  >
                    מספר מנהל
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
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : (Array.isArray(filteredAdmins) ? filteredAdmins : []).map((admin) => (
                <TableRow key={admin.id} hover>
                  <TableCell align="left">{admin.full_name || 'לא מוגדר'}</TableCell>
                  <TableCell align="left">
                    <Chip 
                      label={admin.admin_id || 'לא הוגדר'} 
                      size="small" 
                      icon={<Shield color="#2e7d32"  size={16} />}
                      sx={{ bgcolor: admin.admin_id ? '#e8f5e8' : '#ffebee', color: admin.admin_id ? '#2e7d32' : '#d32f2f', width: "120px" }}
                    />
                  </TableCell>
                  <TableCell align="left">{admin.email || 'לא מוגדר'}</TableCell>
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
        <DialogTitle textAlign="left" fontWeight="bold">
          {editingAdmin ? 'עריכת מנהל' : 'הוספת מנהל חדש'}
        </DialogTitle>
        <DialogContent>
          {!editingAdmin && (
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
              <Shield size={20} style={{ color: '#4caf50' }} />
              <Typography variant="body2" color="#2e7d32">
                <strong>שים לב:</strong> מנהלים משויכים אוטומטית לכל המסלולים האקדמיים במערכת
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
              name="admin_id"
              label="מספר מנהל"
              value={formData.admin_id}
              onChange={handleFormChange}
              required
              fullWidth
              InputProps={{
                readOnly: !isAdminIdEditable
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: !isAdminIdEditable ? '#ff9800' : undefined,
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: !isAdminIdEditable ? '#ff9800' : undefined,
                  },
                },
              }}
              error={Boolean(formData.admin_id && !isAdminIdUnique(formData.admin_id))}
              helperText={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {formData.admin_id && !isAdminIdUnique(formData.admin_id) ? (
                    <>
                      <X size={16} style={{ color: '#f44336' }} />
                      <span>מספר מנהל זה כבר קיים במערכת</span>
                    </>
                  ) : !formData.admin_id || !isAdminIdEditable ? (
                    <>
                      <Lock size={16} style={{ color: '#ff9800' }} />
                      <span>מספר המנהל יתמלא אוטומטית</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={16} style={{ color: '#4caf50' }} />
                      <span>ניתן לערוך את מספר המנהל לפי הצורך</span>
                    </>
                  )}
                </Box>
              }
              placeholder="יתמלא אוטומטית..."
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
            {editingAdmin ? 'עדכן מנהל' : 'הוסף מנהל'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </AdminDesktopGuard>
  );
}
