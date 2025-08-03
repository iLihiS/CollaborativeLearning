
import React, { useState, useEffect } from 'react';
import { User, Student, Lecturer, Message, AcademicTrack, Course } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, User as UserIcon, Palette, Shield, Save, CheckCircle, GraduationCap, Plus, X, Check, ChevronsUpDown } from 'lucide-react';
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
  const [student, setStudent] = useState(null);
  const [lecturer, setLecturer] = useState(null);
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

  useEffect(() => {
    loadUserData();
    loadAcademicTracks();
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
  }, []);

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
        setStudent(studentRecords[0]);
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
        setLecturer(lecturerRecords[0]);
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
      const tracks = await AcademicTrack.filter({active: true});
      setAllTracks(tracks);
      setAvailableTracks(tracks);
    } catch (error) {
      console.error("Error loading academic tracks:", error);
    }
  };

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
    
    // Open dialog to ask for permanent save
    setThemeChangeRequest({ newTheme });
  };
  
  const confirmPermanentThemeChange = () => {
    if (!themeChangeRequest) return;
    const { newTheme } = themeChangeRequest;
    
    sessionStorage.removeItem('session_theme'); // Clear the session theme
    localStorage.setItem('theme', newTheme);
    User.updateMyUserData({ theme_preference: newTheme });
    showSuccess(`ערכת נושא ${newTheme === 'dark' ? 'כהה' : 'בהירה'} נשמרה כהעדפה קבועה`);
    setThemeChangeRequest(null);
  };

  const cancelPermanentThemeChange = () => {
    setThemeChangeRequest(null);
    showSuccess(`ערכת נושא ${theme === 'dark' ? 'כהה' : 'בהירה'} תישאר פעילה לכניסה זו בלבד`);
  };

  const requestRole = (role) => {
    const roleHebrew = role === 'student' ? 'סטודנט' : 'מרצה';
    navigate(createPageUrl(`TrackInquiries?new=true&type=role_request&role=${role}&role_he=${roleHebrew}`));
  };

  const handleAddTrackToSelection = (track) => {
    if (!selectedNewTracks.find(t => t.id === track.id)) {
      setSelectedNewTracks([...selectedNewTracks, track]);
    }
    setTrackComboboxOpen(false);
  };

  const handleRemoveTrackFromSelection = (trackId) => {
    setSelectedNewTracks(selectedNewTracks.filter(t => t.id !== trackId));
  };

  const handleSubmitTrackRequest = async () => {
    if (selectedNewTracks.length === 0) return;
    
    setSubmittingTrackRequest(true);
    try {
      const trackNames = selectedNewTracks.map(t => t.track_name).join(', ');
      await Message.create({
        subject: `בקשה לצירוף למסלולים אקדמיים`,
        content: `שלום, אני מבקש/ת להתקבל למסלולים האקדמיים הבאים: ${trackNames}. תודה.`,
        sender_name: user.full_name,
        sender_email: user.email,
        status: 'pending'
      });

      setSelectedNewTracks([]);
      setShowTrackRequestForm(false);
      showSuccess("הבקשה נשלחה בהצלחה! תקבל התראה לאחר אישור המנהלים.");
    } catch (error) {
      console.error("Error submitting track request:", error);
    }
    setSubmittingTrackRequest(false);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
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
                <div className="flex gap-4">
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
              </CardContent>
            </Card>
          </div>

          {/* Academic and Role Management */}
          <div className="space-y-8">
            {/* Academic Tracks Card - Only for students */}
            {user?.current_role === 'student' && (
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
                            <span className="font-medium text-lime-800">{track.track_name}</span>
                            <p className="text-xs text-lime-700">{track.department}</p>
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
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">בחר מסלולים:</Label>
                        <Popover open={trackComboboxOpen} onOpenChange={setTrackComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={trackComboboxOpen}
                              className="w-full justify-between mt-2"
                            >
                              בחר מסלול...
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
                                      <div className="font-medium">{track.track_name}</div>
                                      <div className="text-xs text-slate-500">{track.department}</div>
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
                                {track.track_name}
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
                          disabled={selectedNewTracks.length === 0 || submittingTrackRequest}
                          className="bg-lime-500 hover:bg-lime-600 text-white"
                        >
                          {submittingTrackRequest ? 'שולח...' : 'שלח בקשה'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowTrackRequestForm(false);
                            setSelectedNewTracks([]);
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
