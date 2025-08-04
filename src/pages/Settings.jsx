
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Sun, Moon, X, User as UserIcon, Palette, Save, CheckCircle, GraduationCap, Plus, ChevronsUpDown, Shield } from 'lucide-react';
import { User, Student, Lecturer, Message, AcademicTrack } from '../api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [theme, setTheme] = useState('light');
  const [userRoles, setUserRoles] = useState([]);
  
  const [allTracks, setAllTracks] = useState([]);
  const [userTracks, setUserTracks] = useState([]);
  const [availableTracks, setAvailableTracks] = useState([]);
  const [selectedNewTracks, setSelectedNewTracks] = useState([]);
  const [trackComboboxOpen, setTrackComboboxOpen] = useState(false);
  const [showTrackRequestForm, setShowTrackRequestForm] = useState(false);
  const [submittingTrackRequest, setSubmittingTrackRequest] = useState(false);
  const [themeChangeRequest, setThemeChangeRequest] = useState(null);
  const [trackRequestError, setTrackRequestError] = useState('');
  const [themeStatus, setThemeStatus] = useState({
    type: 'auto', // 'session', 'permanent', 'auto'
    theme: 'light',
    message: ''
  });

  useEffect(() => {
    loadUserData();
    loadAcademicTracks();
  }, []);

  useEffect(() => {
    // Load current theme properly after user data is loaded
    if (user) {
      const currentTheme = sessionStorage.getItem('session_theme') || user.theme_preference || localStorage.getItem('theme') || 'light';
      setTheme(currentTheme);
      updateThemeStatus();
    }
  }, [user]); // Re-run when user data changes

  // Update theme status whenever theme or user changes
  useEffect(() => {
    updateThemeStatus();
  }, [theme, user]);

  const updateThemeStatus = () => {
    const savedTheme = localStorage.getItem('theme');
    const userPreference = user?.theme_preference;
    const sessionTheme = sessionStorage.getItem('session_theme');
    
    if (userPreference || savedTheme) {
      // Always show the permanent preference first
      const preferredTheme = userPreference || savedTheme;
      setThemeStatus({
        type: sessionTheme ? 'session' : 'permanent',
        theme: preferredTheme,
        message: `העדפה קבועה: ${preferredTheme === 'dark' ? 'כהה' : 'בהיר'}`
      });
    } else if (sessionTheme) {
      // Only session theme, no permanent preference
      setThemeStatus({
        type: 'session',
        theme: sessionTheme,
        message: `נושא זמני: ${sessionTheme === 'dark' ? 'כהה' : 'בהיר'}`
      });
    } else {
      // Auto mode
      setThemeStatus({
        type: 'auto',
        theme: theme,
        message: 'בחירה אוטומטית לפי השעה'
      });
    }
  };

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFullName(currentUser.full_name);
      
      const roles = [];
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
            studentTrackIds.map(async (trackId) => {
              try {
                const trackList = await AcademicTrack.filter({id: trackId});
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
      const tracks = await AcademicTrack.list();
      setAllTracks(tracks);
      
      // Filter out tracks that user already has
      const userTrackIds = userTracks.map(track => track.id);
      const available = tracks.filter(track => !userTrackIds.includes(track.id));
      setAvailableTracks(available);
    } catch (error) {
      console.error("Error loading academic tracks:", error);
    }
  };

  // Update available tracks when user tracks change
  useEffect(() => {
    if (allTracks.length > 0) {
      const userTrackIds = userTracks.map(track => track.id);
      const available = allTracks.filter(track => !userTrackIds.includes(track.id));
      setAvailableTracks(available);
    }
  }, [userTracks, allTracks]);

  const handleProfileUpdate = async () => {
    try {
      await User.updateMyUserData({ full_name: fullName });
      showSuccess("הפרופיל עודכן בהצלחה!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleThemeChange = (newTheme) => {
    // Immediately apply theme visually and for the session
    setTheme(newTheme);
    sessionStorage.setItem('session_theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Update theme status display
    updateThemeStatus();
    
    // Open dialog to ask for permanent save
    setThemeChangeRequest({ newTheme });
  };
  
  const confirmPermanentThemeChange = async () => {
    if (!themeChangeRequest) return;
    const { newTheme } = themeChangeRequest;
    
    try {
      // Save to localStorage for immediate persistence
      localStorage.setItem('theme', newTheme);
      
      // Save to user preferences
      await User.updateMyUserData({ theme_preference: newTheme });
      
      // Remove session theme since we're making it permanent
      sessionStorage.removeItem('session_theme');
      
      // Update theme status display
      updateThemeStatus();
      
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

  const requestRole = (role) => {
    const roleHebrew = role === 'student' ? 'סטודנט' : 'מרצה';
    navigate(createPageUrl(`TrackInquiries?new=true&type=role_request&role=${role}&role_he=${roleHebrew}`));
  };

  const handleAddTrackToSelection = (track) => {
    if (!selectedNewTracks.find(t => t.id === track.id)) {
      setSelectedNewTracks([...selectedNewTracks, track]);
      setTrackRequestError(''); // Clear error when user makes a selection
    }
    setTrackComboboxOpen(false);
  };

  const handleRemoveTrackFromSelection = (trackId) => {
    setSelectedNewTracks(selectedNewTracks.filter(t => t.id !== trackId));
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
        sender_name: user.full_name,
        sender_email: user.email,
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

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResetThemePreference = async () => {
    try {
      // Clear all theme preferences
      await User.updateMyUserData({ theme_preference: null });
      localStorage.removeItem('theme');
      sessionStorage.removeItem('session_theme');
      
      // Reset to automatic theme based on time
      const defaultTheme = new Date().getHours() >= 6 && new Date().getHours() < 22 ? 'light' : 'dark';
      setTheme(defaultTheme);
      document.documentElement.classList.toggle('dark', defaultTheme === 'dark');
      
      updateThemeStatus();
    } catch (error) {
      console.error('Error resetting theme preference:', error);
    }
  };

  const handleResetTemporaryTheme = () => {
    // Remove only the temporary theme
    sessionStorage.removeItem('session_theme');
    
    // Return to permanent preference or automatic
    const userPreference = user?.theme_preference;
    const savedTheme = localStorage.getItem('theme');
    const preferredTheme = userPreference || savedTheme;
    
    if (preferredTheme) {
      // Return to permanent preference
      setTheme(preferredTheme);
      document.documentElement.classList.toggle('dark', preferredTheme === 'dark');
    } else {
      // Return to automatic theme
      const defaultTheme = new Date().getHours() >= 6 && new Date().getHours() < 22 ? 'light' : 'dark';
      setTheme(defaultTheme);
      document.documentElement.classList.toggle('dark', defaultTheme === 'dark');
    }
    
    updateThemeStatus();
  };

  if (loading) {
    return <div className="p-8">טוען הגדרות...</div>;
  }
  
  return (
    <div className="p-4 lg:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <UserIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">הגדרות חשבון</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-3">נהל את פרטי הפרופיל, העדפות התצוגה והתפקידים שלך במערכת.</p>
        </div>

        {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                    {successMessage}
                </AlertDescription>
            </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Profile and Theme Settings */}
          <div className="space-y-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b dark:border-slate-700 pb-3">
                <CardTitle className="flex items-center gap-2 text-black">
                  <UserIcon className="w-5 h-5 text-black"/>
                  פרטים אישיים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <div>
                  <Label htmlFor="email" className="text-black font-medium">כתובת מייל</Label>
                  <Input id="email" type="email" value={user.email} disabled className="mt-1 bg-slate-100 dark:bg-slate-700 dark:border-slate-600"/>
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-black font-medium">שם מלא</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"/>
                </div>
                <Button onClick={handleProfileUpdate} className="bg-lime-500 hover:bg-lime-600 text-white">
                  <Save className="ml-2 w-4 h-4"/>
                  שמור שינויים
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="border-b dark:border-slate-700 pb-3">
                <CardTitle className="flex items-center gap-2 text-black">
                  <Palette className="w-5 h-5 text-black"/>
                  ערכת נושא
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <p className="text-slate-600 dark:text-slate-400 mb-4">בחר את התצוגה המועדפת עליך</p>
                <div className="flex gap-4 mb-4">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    onClick={() => handleThemeChange('light')} 
                    className={`flex-1 ${theme === 'light' 
                      ? 'bg-lime-500 hover:bg-lime-600 text-white' 
                      : 'text-lime-700 hover:bg-lime-50 hover:text-lime-800 hover:border-lime-400 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sun className="ml-2 w-4 h-4"/>
                    בהיר
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    onClick={() => handleThemeChange('dark')} 
                    className={`flex-1 ${theme === 'dark' 
                      ? 'bg-lime-500 hover:bg-lime-600 text-white' 
                      : 'text-lime-700 hover:bg-lime-50 hover:text-lime-800 hover:border-lime-400 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Moon className="ml-2 w-4 h-4"/>
                    כהה
                  </Button>
                </div>

                {/* Current Preference Display */}
                <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          <span className={`${
                            themeStatus.type === 'session' ? 'text-lime-600 dark:text-lime-400' :
                            themeStatus.type === 'permanent' ? 'text-lime-600 dark:text-lime-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>
                            {themeStatus.message}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                            {themeStatus.type === 'permanent' && 'תישמר לכניסות הבאות'}
                            {themeStatus.type === 'session' && (user?.theme_preference || localStorage.getItem('theme')) && 'תישמר לכניסות הבאות'}
                            {themeStatus.type === 'auto' && 'בהיר ביום (6:00-22:00), כהה בלילה'}
                          </span>
                        </p>
                      </div>
                      
                      {/* Forget preference button - always at the top */}
                      {(themeStatus.type === 'session' || themeStatus.type === 'permanent') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetThemePreference}
                                className="text-xs mr-2"
                              >
                                שכח העדפה
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">שכח את כל ההעדפות וחזור לבחירה אוטומטית</p>
                              <p className="text-xs text-slate-400 mt-1">בהיר ביום (6:00-22:00), כהה בלילה</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    {/* Show temporary theme override if exists */}
                    {themeStatus.type === 'session' && sessionStorage.getItem('session_theme') && (user?.theme_preference || localStorage.getItem('theme')) && (
                      <TooltipProvider>
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-600 dark:text-amber-400 text-sm">
                              נושא זמני: {sessionStorage.getItem('session_theme') === 'dark' ? 'כהה' : 'בהיר'}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleResetTemporaryTheme}
                                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">שכח העדפה זמנית וחזור לערכת הנושא המועדפת</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                            יתאפס בהתנתקות ויחזור להעדפה הקבועה
                          </span>
                        </div>
                      </TooltipProvider>
                    )}
                    
                    {/* Show regular temporary theme if no permanent preference */}
                    {themeStatus.type === 'session' && sessionStorage.getItem('session_theme') && !(user?.theme_preference || localStorage.getItem('theme')) && (
                      <TooltipProvider>
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-600 dark:text-amber-400 text-sm">
                              נושא זמני: {sessionStorage.getItem('session_theme') === 'dark' ? 'כהה' : 'בהיר'}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleResetTemporaryTheme}
                                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                >
                                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">שכח העדפה זמנית וחזור לבחירה אוטומטית</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                            יתאפס בהתנתקות
                          </span>
                        </div>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Academic and Role Management */}
          <div className="space-y-8">
            {/* Academic Tracks Card - Only for students (excluding admins) */}
            {user?.current_role === 'student' && !userRoles.includes('admin') && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="border-b dark:border-slate-700 pb-3">
                  <CardTitle className="flex items-center gap-2 text-black">
                    <GraduationCap className="w-5 h-5 text-black"/>
                    מסלולים אקדמיים
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">המסלולים שלך במערכת:</p>
                  
                  {/* Current tracks */}
                  <div className="space-y-3 mb-4">
                    {userTracks.length > 0 ? (
                      userTracks.map(track => (
                        <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-lime-100 border border-lime-300">
                          <CheckCircle className="w-5 h-5 text-lime-700" />
                          <div>
                            <span className="font-medium text-lime-800">{track.name}</span>
                            <p className="text-xs text-lime-700">{track.department}</p>
                            <p className="text-xs text-lime-600">{track.degree_type}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-500 text-sm">עדיין לא שויכת למסלולים אקדמיים</p>
                      </div>
                    )}
                  </div>

                  {/* Request form */}
                  {!showTrackRequestForm ? (
                    <Button 
                      variant="outline"
                      className="w-full text-lime-700 hover:bg-lime-50 hover:text-lime-800 hover:border-lime-400 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                      onClick={() => setShowTrackRequestForm(true)}
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      הגש בקשה למסלול אקדמי נוסף
                    </Button>
                  ) : (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <Label className={`text-sm font-medium ${trackRequestError ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          בחר מסלולים:
                          {trackRequestError && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {trackRequestError && (
                          <p className="text-red-600 text-xs mt-1">{trackRequestError}</p>
                        )}
                        <Popover open={trackComboboxOpen} onOpenChange={setTrackComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={trackComboboxOpen}
                              className={`w-full justify-between mt-2 ${trackRequestError ? 'border-red-300 focus:border-red-500' : ''}`}
                            >
                              {selectedNewTracks.length > 0 
                                ? `נבחרו ${selectedNewTracks.length} מסלולים`
                                : 'בחר מסלול...'
                              }
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" dir="rtl">
                            <Command>
                              <CommandInput placeholder="חפש מסלול..." />
                              <CommandEmpty>לא נמצא מסלול.</CommandEmpty>
                              <CommandGroup>
                                {availableTracks.map((track) => (
                                  <CommandItem
                                    key={track.id}
                                    onSelect={() => handleAddTrackToSelection(track)}
                                    className="justify-between"
                                  >
                                    <div>
                                      <div className="font-medium">{track.name}</div>
                                      <div className="text-xs text-slate-500">{track.department}</div>
                                      <div className="text-xs text-slate-400">{track.degree_type}</div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Selected tracks */}
                      {selectedNewTracks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">מסלולים שנבחרו:</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedNewTracks.map(track => (
                              <Badge key={track.id} className="bg-lime-100 text-lime-800 border-lime-300">
                                {track.name}
                                <X 
                                  className="w-3 h-3 ml-1 cursor-pointer" 
                                  onClick={() => handleRemoveTrackFromSelection(track.id)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          onClick={handleSubmitTrackRequest}
                          disabled={submittingTrackRequest}
                          className="bg-lime-500 hover:bg-lime-600 text-white"
                        >
                          {submittingTrackRequest ? 'שולח...' : 'שלח בקשה'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowTrackRequestForm(false);
                            setSelectedNewTracks([]);
                            setTrackRequestError('');
                          }}
                        >
                          ביטול
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">בקשות למסלולים חדשים יועברו לאישור מנהלי המערכת.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Role Management */}
            <Card className="border-0 shadow-lg bg-white h-fit">
              <CardHeader className="border-b dark:border-slate-700 pb-3">
                <CardTitle className="flex items-center gap-2 text-black">
                  <Shield className="w-5 h-5 text-black"/>
                  ניהול תפקידים
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <p className="text-slate-600 dark:text-slate-400 mb-4">התפקידים שלך במערכת:</p>
                <div className="space-y-3">
                  
                  {userRoles.map(role => (
                    <div 
                      key={role} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        user?.current_role === role 
                          ? 'bg-lime-100 border-lime-300' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 ${user?.current_role === role ? 'text-lime-700' : 'text-slate-400'}`} />
                      <span className={`font-medium ${user?.current_role === role ? 'text-lime-800' : 'text-slate-600'}`}>
                        תפקיד {role === 'student' ? 'סטודנט' : role === 'lecturer' ? 'מרצה' : 'מנהל'} {user?.current_role === role ? 'פעיל' : 'זמין'}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Conditional section for requests or success message */}
                <div className="mt-4">
                  {userRoles.includes('student') && userRoles.includes('lecturer') ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-lime-50 border border-lime-200">
                        <CheckCircle className="w-5 h-5 text-lime-600" />
                        <span className="font-medium text-lime-700 text-sm">כל התפקידים הנדרשים כבר זמינים עבורך.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                        {!userRoles.includes('student') && (
                            <Button 
                              variant="outline"
                              className="w-full text-lime-700 hover:bg-lime-50 hover:text-lime-800 hover:border-lime-400 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                              onClick={() => requestRole('student')}
                            >
                                הגש בקשה לתפקיד סטודנט
                            </Button>
                        )}
                        {!userRoles.includes('lecturer') && (
                            <Button 
                              variant="outline"
                              className="w-full text-lime-700 hover:bg-lime-50 hover:text-lime-800 hover:border-lime-400 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
                              onClick={() => requestRole('lecturer')}
                            >
                                הגש בקשה לתפקיד מרצה
                            </Button>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-1">בקשות לתפקידים חדשים יועברו לאישור מנהלי המערכת.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!themeChangeRequest} onOpenChange={(open) => !open && setThemeChangeRequest(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>שמירת ערכת נושא</AlertDialogTitle>
            <AlertDialogDescription>
              האם תרצה לשמור את ערכת הנושא ה{themeChangeRequest?.newTheme === 'dark' ? 'כהה' : 'בהירה'} כהעדפה קבועה לכניסות הבאות?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={cancelPermanentThemeChange}>לא, רק הפעם</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentThemeChange} className="bg-lime-500 hover:bg-lime-600">
              כן, שמור כהעדפה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
