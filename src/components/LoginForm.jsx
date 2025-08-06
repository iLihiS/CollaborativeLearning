/* eslint-disable react/prop-types */
import { useState } from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Box,
  Divider,
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { User } from '@/api/entities';

export function LoginForm({ onLoginSuccess, onLoginError }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await User.login(formData);
      onLoginSuccess(response);
    } catch (error) {
      console.error('Login failed:', error);
      onLoginError(error.message || 'שגיאה בהתחברות. אנא בדוק את הפרטים וחזור שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Demo users for easy access
  const demoUsers = [
    { email: 'student@ono.ac.il', label: 'סטודנט בלבד' },
    { email: 'lecturer@ono.ac.il', label: 'מרצה בלבד' },
    { email: 'admin@ono.ac.il', label: 'מנהל בלבד' },
    { email: 'student.lecturer@ono.ac.il', label: 'סטודנט + מרצה' },
    { email: 'lecturer.admin@ono.ac.il', label: 'מרצה + מנהל' },
    { email: 'all.roles@ono.ac.il', label: 'כל התפקידים' }
  ];

  const fillDemoUser = (email) => {
    setFormData({ email, password: '123456' });
  };

  return (
    <Card sx={{ maxWidth: 450, margin: 'auto' }}>
      <CardHeader
        title={<Typography variant="h5" component="h1" align="center" fontWeight="bold">התחברות למערכת</Typography>}
        subheader={<Typography variant="body2" align="center">הזן את כתובת המייל והסיסמה שלך כדי להתחבר</Typography>}
      />
      <CardContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="כתובת מייל"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleInputChange}
            dir="ltr"
            sx={{ '& .MuiInputBase-input': { textAlign: 'left' } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="סיסמה"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleInputChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, bgcolor: '#84cc16', '&:hover': { bgcolor: '#65a30d' } }}
            disabled={loading || !formData.email || !formData.password}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'התחבר'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>משתמשי דמו לבדיקה</Typography>
        </Divider>

        <Grid container spacing={1}>
          {demoUsers.map((user) => (
            <Grid item xs={12} key={user.email}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => fillDemoUser(user.email)}
                sx={{ justifyContent: 'space-between', textTransform: 'none' }}
              >
                <Typography component="span" fontWeight="medium">{user.label}</Typography>
                <Typography component="span" sx={{ color: 'text.secondary', direction: 'ltr' }}>{user.email}</Typography>
              </Button>
            </Grid>
          ))}
        </Grid>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          סיסמה לכל המשתמשים: 123456
        </Typography>
      </CardContent>
    </Card>
  );
} 