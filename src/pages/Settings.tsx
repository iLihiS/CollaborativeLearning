
import { useState, useEffect } from 'react';
import {
    Card, CardHeader, CardContent, Button, TextField, Typography, Box, Alert,
    Accordion, AccordionSummary, AccordionDetails, IconButton,
    ToggleButtonGroup, ToggleButton, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, Autocomplete, Chip, CircularProgress, Avatar,
    Grid
} from '@mui/material';
import {
    Sun, Moon, User as UserIcon, Palette, Save, CheckCircle, GraduationCap,
    Plus, Shield, Lock, Eye, EyeOff
} from 'lucide-react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { User as UserEntity, Student, Lecturer, Message, AcademicTrack as AcademicTrackEntity } from '../api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';


type User = {
    id: string;
    full_name: string;
    email: string;
    roles: string[];
    current_role: string;
    theme_preference: string;
    academic_track_ids?: string[];
};

type AcademicTrack = {
    id: string;
    name: string;
    department: string;
};

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [allTracks, setAllTracks] = useState<AcademicTrack[]>([]);
  const [userTracks, setUserTracks] = useState<AcademicTrack[]>([]);
  const [availableTracks, setAvailableTracks] = useState<AcademicTrack[]>([]);
  const [selectedNewTracks, setSelectedNewTracks] = useState<AcademicTrack[]>([]);
  const [showTrackRequestForm, setShowTrackRequestForm] = useState(false);
  const [submittingTrackRequest, setSubmittingTrackRequest] = useState(false);
  const [themeChangeRequest, setThemeChangeRequest] = useState<{ newTheme: string } | null>(null);
  const [trackRequestError, setTrackRequestError] = useState('');

  useEffect(() => {
    loadUserData();
    loadAcademicTracks();
  }, []);

  useEffect(() => {
    // Load current theme properly after user data is loaded
    if (user) {
      const currentTheme = sessionStorage.getItem('session_theme') || user.theme_preference || localStorage.getItem('theme') || 'light';
      setTheme(currentTheme);
    }
  }, [user]); // Re-run when user data changes

  // Update theme status whenever theme or user changes
  useEffect(() => {
    // This useEffect is no longer needed as themeStatus state is removed
  }, [theme, user]);

  const loadUserData = async () => {
    try {
      const currentUser = await UserEntity.me();
      setUser(currentUser);
      setFullName(currentUser.full_name);
      
      const roles: string[] = [];
      const [studentRecords, lecturerRecords] = await Promise.all([
        Student.filter({ email: currentUser.email }),
        Lecturer.filter({ email: currentUser.email }),
      ]);
      
      if(studentRecords.length > 0) {
        roles.push('student');
        
        // Load user's academic tracks
        const studentTrackIds = studentRecords[0].academic_track_ids || [];
        if (studentTrackIds.length > 0) {
          const tracks = await Promise.all(
            studentTrackIds.map(async (trackId: string) => {
              try {
                const trackList = await AcademicTrackEntity.filter({id: trackId});
                return trackList[0];
              } catch {
                return null;
              }
            })
          );
          setUserTracks(tracks.filter(track => track !== null));
        }
      }
      
      if(lecturerRecords.length > 0) {
        roles.push('lecturer');
      }
      
      if (currentUser.role === 'admin') {
        roles.push('admin');
      }
      setUserRoles(roles.sort());

    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setLoading(false);
  };

  const loadAcademicTracks = async () => {
    try {
      // Load tracks from the JSON file in public folder
      const tracks = await AcademicTrackEntity.list();
      setAllTracks(tracks);
      
      // Filter out tracks that user already has
      const userTrackIds = userTracks.map(track => track.id);
      const available = tracks.filter((track: AcademicTrack) => !userTrackIds.includes(track.id));
      setAvailableTracks(available);
    } catch (error) {
      console.error("Error loading academic tracks:", error);
    }
  };

  // Update available tracks when user tracks change
  useEffect(() => {
    if (allTracks.length > 0) {
      const userTrackIds = userTracks.map(track => track.id);
      const available = allTracks.filter((track: AcademicTrack) => !userTrackIds.includes(track.id));
      setAvailableTracks(available);
    }
  }, [userTracks, allTracks]);

  const handleProfileUpdate = async () => {
    try {
      await UserEntity.updateMyUserData({ full_name: fullName });
      showSuccess("הפרופיל עודכן בהצלחה!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('הסיסמאות החדשות אינן תואמות');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('סיסמה חדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    try {
      await UserEntity.updateMyUserData({ password: newPassword });
      showSuccess("הסיסמה עודכנה בהצלחה!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'שגיאה בעדכון הסיסמה');
    }
  };

  const handleThemeChange = (event: React.MouseEvent<HTMLElement>, newTheme: string | null) => {
    if (newTheme !== null) {
    setTheme(newTheme);
    sessionStorage.setItem('session_theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
      // updateThemeStatus(); // This function is removed
    setThemeChangeRequest({ newTheme });
    }
  };
  
  const confirmPermanentThemeChange = async () => {
    if (!themeChangeRequest) return;
    const { newTheme } = themeChangeRequest;
    
    try {
      // Save to localStorage for immediate persistence
      localStorage.setItem('theme', newTheme);
      
      // Save to user preferences
      await UserEntity.updateMyUserData({ theme_preference: newTheme });
      
      // Remove session theme since we're making it permanent
      sessionStorage.removeItem('session_theme');
      
      // Update theme status display
      // updateThemeStatus(); // This function is removed
      
      showSuccess(`ערכת נושא ${newTheme === 'dark' ? 'כהה' : 'בהירה'} נשמרה כהעדפה קבועה`);
    } catch (error) {
      console.error("Error saving theme preference:", error);
      showSuccess(`ערכת נושא ${newTheme === 'dark' ? 'כהה' : 'בהירה'} הוחלה לכניסה זו`);
    }
    
    setThemeChangeRequest(null);
  };

  const cancelPermanentThemeChange = () => {
    setThemeChangeRequest(null);
    // Don't update theme status - keep the original message, just show it's temporary
    showSuccess(`ערכת נושא ${theme === 'dark' ? 'כהה' : 'בהירה'} תישאר פעילה לכניסה זו בלבד`);
  };

  const requestRole = (role: string) => {
    const roleHebrew = role === 'student' ? 'סטודנט' : 'מרצה';
    navigate(createPageUrl(`TrackInquiries?new=true&type=role_request&role=${role}&role_he=${roleHebrew}`));
  };

  const handleSubmitTrackRequest = async () => {
    // Validation - must select at least one track
    if (selectedNewTracks.length === 0) {
      setTrackRequestError('חובה לבחור לפחות מסלול אקדמי אחד');
      return;
    }
    
    setTrackRequestError(''); // Clear any previous errors
    setSubmittingTrackRequest(true);
    
    try {
      const trackNames = selectedNewTracks.map(t => t.name).join(', ');
      await Message.create({
        subject: `בקשה לצירוף למסלולים אקדמיים`,
        content: `שלום, אני מבקש/ת להתקבל למסלולים האקדמיים הבאים: ${trackNames}. תודה.`,
        sender_name: user?.full_name,
        sender_email: user?.email,
        status: 'pending'
      });

      setSelectedNewTracks([]);
      setShowTrackRequestForm(false);
      setTrackRequestError('');
      showSuccess("הבקשה נשלחה בהצלחה! תקבל התראה לאחר אישור המנהלים.");
    } catch (error) {
      console.error("Error submitting track request:", error);
      setTrackRequestError('שגיאה בשליחת הבקשה. נסה שוב.');
    }
    
    setSubmittingTrackRequest(false);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (loading) {
    return <Box p={4}>טוען הגדרות...</Box>;
  }
  
  return (
    <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <UserIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">הגדרות חשבון</Typography>
            <Typography color="text.secondary">נהל את פרטי הפרופיל, העדפות התצוגה והתפקידים שלך במערכת.</Typography>
          </Box>
        </Box>
      </Box>

        {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
            </Alert>
        )}

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Card elevation={2}>
              <CardHeader title={<Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><UserIcon /> פרטים אישיים</Typography>} />
              <CardContent>
                <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="כתובת מייל" value={user?.email} disabled fullWidth />
                  <TextField label="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
                  <Button onClick={handleProfileUpdate} variant="contained" startIcon={<Save />}>שמור שינויים</Button>
                </Box>
              </CardContent>
            </Card>

            <Accordion elevation={2}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="password-content" id="password-header">
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Lock /> שינוי סיסמה</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {passwordError && <Alert severity="error">{passwordError}</Alert>}
                  <TextField type={showOldPassword ? 'text' : 'password'} label="סיסמה נוכחית" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} fullWidth InputProps={{ endAdornment: <IconButton onClick={() => setShowOldPassword(!showOldPassword)}>{showOldPassword ? <EyeOff /> : <Eye />}</IconButton> }} />
                  <TextField type={showNewPassword ? 'text' : 'password'} label="סיסמה חדשה" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth InputProps={{ endAdornment: <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff /> : <Eye />}</IconButton> }} />
                  <TextField type={showConfirmPassword ? 'text' : 'password'} label="אימות סיסמה חדשה" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth InputProps={{ endAdornment: <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</IconButton> }} />
                  <Button onClick={handlePasswordChange} variant="contained" startIcon={<Save />}>עדכן סיסמה</Button>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            <Card elevation={2}>
              <CardHeader title={<Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Palette /> ערכת נושא</Typography>} />
              <CardContent>
                <Typography color="text.secondary" mb={2}>בחר את התצוגה המועדפת עליך</Typography>
                <ToggleButtonGroup value={theme} exclusive onChange={handleThemeChange} fullWidth>
                  <ToggleButton value="light"><Sun style={{ marginLeft: 8 }} />בהיר</ToggleButton>
                  <ToggleButton value="dark"><Moon style={{ marginLeft: 8 }}/>כהה</ToggleButton>
                </ToggleButtonGroup>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(user?.current_role === 'student' || user?.current_role === 'lecturer') && !userRoles.includes('admin') && (
              <Card elevation={2}>
                <CardHeader title={<Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><GraduationCap /> מסלולים אקדמיים</Typography>} />
                <CardContent>
                  <Typography color="text.secondary" mb={2}>המסלולים שלך במערכת:</Typography>
                    {userTracks.length > 0 ? (
                      userTracks.map((track: AcademicTrack) => (
                      <Alert icon={<CheckCircle />} severity="success" key={track.id} sx={{ mb: 1 }}>{track.name} - {track.department}</Alert>
                    ))
                  ) : (
                    <Typography>עדיין לא שויכת למסלולים אקדמיים</Typography>
                  )}

                  <Button fullWidth variant="outlined" startIcon={<Plus />} sx={{ mt: 2 }} onClick={() => setShowTrackRequestForm(!showTrackRequestForm)}>
                    {showTrackRequestForm ? 'בטל בקשה' : 'הגש בקשה למסלול נוסף'}
                  </Button>
                  
                  {showTrackRequestForm && (
                    <Box mt={2} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Autocomplete
                        multiple
                        options={availableTracks}
                        getOptionLabel={(option) => option.name}
                        value={selectedNewTracks}
                        onChange={(event, newValue) => { setSelectedNewTracks(newValue); }}
                        renderInput={(params) => (
                          <TextField {...params} variant="outlined" label="בחר מסלולים" placeholder="הוסף מסלול" error={!!trackRequestError} helperText={trackRequestError} />
                        )}
                        renderTags={(value: readonly AcademicTrack[], getTagProps) =>
                          value.map((option: AcademicTrack, index: number) => (
                            <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} />
                          ))
                        }
                      />
                      <Button onClick={handleSubmitTrackRequest} variant="contained" disabled={submittingTrackRequest}>
                        {submittingTrackRequest ? <CircularProgress size={24} /> : 'שלח בקשה'}
                        </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            <Card elevation={2}>
              <CardHeader title={<Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Shield /> ניהול תפקידים</Typography>} />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography color="text.secondary">התפקידים שלך במערכת:</Typography>
                  {userRoles.map(role => (
                  <Alert key={role} icon={<CheckCircle />} severity={user?.current_role === role ? "success" : "info"}>
                        תפקיד {role === 'student' ? 'סטודנט' : role === 'lecturer' ? 'מרצה' : 'מנהל'} {user?.current_role === role ? 'פעיל' : 'זמין'}
                  </Alert>
                ))}
                {!userRoles.includes('student') && <Button fullWidth variant="outlined" onClick={() => requestRole('student')}>הגש בקשה לתפקיד סטודנט</Button>}
                {!userRoles.includes('lecturer') && <Button fullWidth variant="outlined" onClick={() => requestRole('lecturer')}>הגש בקשה לתפקיד מרצה</Button>}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={!!themeChangeRequest} onClose={() => setThemeChangeRequest(null)}>
        <DialogTitle>שמירת ערכת נושא</DialogTitle>
        <DialogContent>
          <DialogContentText>
              האם תרצה לשמור את ערכת הנושא ה{themeChangeRequest?.newTheme === 'dark' ? 'כהה' : 'בהירה'} כהעדפה קבועה לכניסות הבאות?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPermanentThemeChange}>לא, רק הפעם</Button>
          <Button onClick={confirmPermanentThemeChange} variant="contained">כן, שמור כהעדפה</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
