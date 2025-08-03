
import { useState, useEffect } from "react";
import { User, Course, File, Student, Lecturer, Message, Notification } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  FileText,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  ChevronDown,
  GraduationCap,
  MessageSquare,
  Plus,
  Heart,
  Users,
  Briefcase,
  FileCog
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const MORNING_START = 5;
const AFTERNOON_START = 12;
const EVENING_START = 18;
const NIGHT_START = 22;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    approvedFiles: 0,
    pendingFiles: 0,
    rejectedFiles: 0,
    totalDownloads: 0
  });
  const [greeting, setGreeting] = useState({ text: "", icon: null });
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= MORNING_START && currentHour < AFTERNOON_START) {
        setGreeting({ text: "בוקר טוב", icon: <Sun className="w-5 h-5 text-yellow-300" /> });
    } else if (currentHour >= AFTERNOON_START && currentHour < EVENING_START) {
        setGreeting({ text: "צהריים טובים", icon: <Sun className="w-5 h-5 text-yellow-300" /> });
    } else if (currentHour >= EVENING_START && currentHour < NIGHT_START) {
        setGreeting({ text: "ערב טוב", icon: <Moon className="w-5 h-5 text-slate-300" /> });
    } else {
        setGreeting({ text: "לילה טוב", icon: <Moon className="w-5 h-5 text-slate-300" /> });
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      let roles = currentUser.roles || [];
      if (roles.length === 0) {
        const [studentRecords, lecturerRecords] = await Promise.all([
          Student.filter({ email: currentUser.email }),
          Lecturer.filter({ email: currentUser.email }),
        ]);
        if (studentRecords.length > 0) roles.push('student');
        if (lecturerRecords.length > 0) roles.push('lecturer');
        if (currentUser.email.includes('admin')) roles.push('admin');
      }
      setUserRoles(roles);

      let studentRecord = null;
      if (roles.includes('student')) {
        const studentRecords = await Student.filter({ email: currentUser.email });
        studentRecord = studentRecords[0] || await Student.create({
          full_name: currentUser.full_name,
          student_id: currentUser.student_id || `STU${Date.now()}`,
          email: currentUser.email,
          academic_track: currentUser.academic_track || "לא שויך מסלול",
          registered_courses: [],
        });
      }

      let lecturerRecords = [];
      if (roles.includes('lecturer')) {
        lecturerRecords = await Lecturer.filter({ email: currentUser.email });
        if (lecturerRecords.length === 0) {
          lecturerRecords.push(await Lecturer.create({
            full_name: currentUser.full_name,
            email: currentUser.email,
            assigned_courses: [],
            semester_start: "סמסטר א' תשפ\"ה",
            department: currentUser.department || "מדעי המחשב"
          }));
        }
      }

      if (!currentUser.current_role) {
        const defaultRole = roles.includes('student') ? 'student' :
                           roles.includes('lecturer') ? 'lecturer' : 'admin';
        const updatedUser = await User.updateMyUserData({ current_role: defaultRole });
        setUser(updatedUser);
      }

      if (currentUser.current_role !== 'admin') {
        const [userFiles, userInquiries, userNotifications, allFiles, allCourses] = await Promise.all([
          File.filter({ uploader_id: studentRecord?.student_id }),
          Message.filter({ sender_email: currentUser.email }, '-created_date'),
          Notification.filter({ user_email: currentUser.email }, '-created_date', 5),
          File.filter({ status: 'pending' }),
          Course.list()
        ]);

        const totalDownloads = userFiles.reduce((sum, file) => sum + (file.download_count || 0), 0);
        
        let pendingFilesForLecturer = 0;
        if (currentUser.current_role === 'lecturer' && lecturerRecords.length > 0) {
          const lecturerCourseIds = allCourses
            .filter(c => c.lecturer_id === lecturerRecords[0].id)
            .map(c => c.id);
          pendingFilesForLecturer = allFiles.filter(f => lecturerCourseIds.includes(f.course_id)).length;
        }
        
        setRecentFiles(userNotifications);
        setRecentInquiries(userInquiries.slice(0, 3));

        setStats({
          totalFiles: userFiles.length,
          approvedFiles: userFiles.filter(f => f.status === 'approved').length,
          pendingFiles: currentUser.current_role === 'student' ? userFiles.filter(f => f.status === 'pending').length : pendingFilesForLecturer,
          rejectedFiles: userFiles.filter(f => f.status === 'rejected').length,
          totalDownloads: totalDownloads
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (error.message?.includes('not authenticated')) {
        await User.login();
      }
    }
    setLoading(false);
  };

  const switchRole = async (newRole) => {
    try {
      await User.updateMyUserData({ current_role: newRole });
      window.location.reload();
    } catch (error) {
      console.error("Error switching role:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getInquiryStatusBadge = (status) => {
    if (status === 'handled') {
      return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 ml-1" />טופל</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 ml-1" />ממתין</Badge>;
  };

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen" dir="rtl">
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(100%) skewX(-15deg);
          }
          100% {
            transform: translateX(-100%) skewX(-15deg);
          }
        }

        .shimmer-effect::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(100%) skewX(-15deg);
          background: linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%);
          animation: shimmer 4s infinite linear;
          z-index: 1;
        }

        .shimmer-effect > * {
          position: relative;
          z-index: 2;
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 text-white shadow-2xl shimmer-effect">
          <div className="absolute inset-0 bg-black/10 z-0"></div>
          
          {/* TOP ROW */}
          <div className="relative flex flex-col sm:flex-row justify-between items-start p-4 sm:p-6 lg:p-8 lg:pb-0 gap-4">
            {/* GREETING/NAME + AVATAR on RIGHT */}
            <div className="flex items-center sm:items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm shrink-0">
                <span className="text-xl sm:text-2xl font-bold">{user?.full_name?.charAt(0) || 'L'}</span>
              </div>
              <div className="text-right">
                <p className="text-base sm:text-lg text-white/90 flex items-center gap-2">
                  {greeting.text}
                  {greeting.icon}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {user?.full_name || 'משתמש'}
                </h1>
              </div>
            </div>
            
            {/* ROLE BUTTON on LEFT */}
            <div className="flex items-start w-full sm:w-auto">
              {userRoles.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full sm:w-auto bg-white/20 hover:bg-white hover:text-lime-600 text-white border-2 border-transparent shadow-lg px-4 sm:px-6 py-2 h-auto text-base transition-all duration-300">
                      <GraduationCap className="w-4 h-4 ml-2" />
                      {user?.current_role === 'lecturer' ? 'מרצה' : 
                       user?.current_role === 'admin' ? 'מנהל' : 'סטודנט'}
                      <ChevronDown className="w-4 h-4 mr-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" dir="rtl">
                    {userRoles.includes('student') && user?.current_role !== 'student' && (
                      <DropdownMenuItem onClick={() => switchRole('student')}>מעבר לתצוגת סטודנט</DropdownMenuItem>
                    )}
                    {userRoles.includes('lecturer') && user?.current_role !== 'lecturer' && (
                      <DropdownMenuItem onClick={() => switchRole('lecturer')}>מעבר לתצוגת מרצה</DropdownMenuItem>
                    )}
                    {userRoles.includes('admin') && user?.current_role !== 'admin' && (
                      <DropdownMenuItem onClick={() => switchRole('admin')}>מעבר לתצוגת מנהל</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                 <Button className="w-full sm:w-auto bg-white/20 text-white border-0 px-4 py-2 text-base font-medium h-full flex items-center cursor-default">
                  <GraduationCap className="w-4 h-4 ml-2" />
                  {user?.current_role === 'lecturer' ? 'מרצה' : 
                   user?.current_role === 'admin' ? 'מנהל' : 'סטודנט'}
                </Button>
              )}
            </div>
          </div>
          
          {/* BOTTOM ROW */}
          <div className="relative flex flex-col-reverse sm:flex-row justify-between items-start sm:items-end p-4 sm:p-6 pt-0 lg:p-8 lg:pt-2 gap-4">
            {/* WELCOME MESSAGE + UPLOAD BUTTON on RIGHT */}
            <div className="text-right w-full sm:w-auto">
              <p className="text-base sm:text-lg text-white/90 mb-4 hidden sm:block">
                ברוכים הבאים לשיתוף האקדמי שלכם
              </p>
              <Link to={createPageUrl("UploadFile")} className="w-full">
                <Button 
                  className="custom-upload-btn shadow-lg px-6 py-2 h-auto text-base transition-all duration-300 w-full sm:w-auto"
                  style={{
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#212121' : 'white',
                    color: document.documentElement.classList.contains('dark') ? 'white' : '#65a30d',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = document.documentElement.classList.contains('dark') ? 'black' : 'white';
                    e.target.style.borderColor = document.documentElement.classList.contains('dark') ? 'black' : 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#212121' : 'white';
                    e.target.style.color = document.documentElement.classList.contains('dark') ? 'white' : '#65a30d';
                    e.target.style.borderColor = 'transparent';
                  }}
                >
                  <Upload className="w-4 h-4 ml-2" />
                  העלאת קובץ חדש
                </Button>
              </Link>
            </div>
            
            {/* DATE + TIME on LEFT */}
            <div className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {format(new Date(), 'HH:mm d.M.yyyy', { locale: he })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {user?.current_role === 'admin' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Admin Quick Links */}
            <Link to={createPageUrl("AdminCourseManagement")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-5 h-5 text-sky-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ניהול קורסים</h2>
                <p className="text-xs text-slate-400">עריכה והוספה</p>
              </div>
            </Link>
            <Link to={createPageUrl("AdminStudentManagement")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-teal-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ניהול סטודנטים</h2>
                <p className="text-xs text-slate-400">עריכה והוספה</p>
              </div>
            </Link>
            <Link to={createPageUrl("AdminLecturerManagement")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ניהול מרצים</h2>
                <p className="text-xs text-slate-400">עריכה והוספה</p>
              </div>
            </Link>
            <Link to={createPageUrl("AdminFileManagement")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileCog className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">ניהול קבצים</h2>
                <p className="text-xs text-slate-400">צפייה וסינון</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Downloads Card */}
            <Link to={createPageUrl("Notifications")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{stats.totalDownloads}</h2>
                <p className="text-slate-500 text-xs">הורדות</p>
                <p className="text-xs text-slate-400">לקבצים שלך</p>
              </div>
            </Link>

            {/* Total Files Card */}
            <Link to={createPageUrl("MyFiles")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{stats.totalFiles}</h2>
                <p className="text-slate-500 text-xs">קבצים</p>
                <p className="text-xs text-slate-400">שהעלת</p>
              </div>
            </Link>

            {/* Approved Card */}
            <Link to={createPageUrl("MyFiles?status=approved")} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{stats.approvedFiles}</h2>
                <p className="text-slate-500 text-xs">קבצים</p>
                <p className="text-xs text-slate-400">מאושרים</p>
              </div>
            </Link>

            {/* Pending Card */}
            <Link 
              to={createPageUrl(user?.current_role === 'student' ? "MyFiles?status=pending" : "LecturerPendingFiles")} 
              className="block"
            >
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{stats.pendingFiles}</h2>
                <p className="text-slate-500 text-xs">
                  {user?.current_role === 'student' ? 'ממתינה' : 'ממתינים'}
                </p>
                <p className="text-xs text-slate-400">
                  {user?.current_role === 'student' ? 'לבדיקה' : 'לאישורך'}
                </p>
              </div>
            </Link>

            {/* Rejected Card */}
            <Link to={createPageUrl("MyFiles?status=rejected")} className="block col-span-2 md:col-span-1">
              <div className="bg-white rounded-2xl p-4 shadow-lg text-center h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{stats.rejectedFiles}</h2>
                <p className="text-slate-500 text-xs">קבצים</p>
                <p className="text-xs text-slate-400">שנדחו</p>
              </div>
            </Link>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity (now Notifications) */}
          <Card className="border-0 shadow-lg bg-white flex flex-col">
            <CardHeader className="border-b bg-slate-50/50 p-4 rounded-t-lg">
              <CardTitle className="text-xl dark:text-slate-900">פעילויות אחרונות</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              {recentFiles.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        !notification.is_read 
                          ? 'border-lime-200 bg-lime-50/50 hover:bg-lime-50' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          notification.type === 'file_approved' ? 'bg-green-100' :
                          notification.type === 'file_rejected' ? 'bg-red-100' :
                          notification.type === 'file_uploaded' ? 'bg-blue-100' : 'bg-slate-100'
                        }`}>
                          {notification.type === 'file_approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {notification.type === 'file_rejected' && <XCircle className="w-5 h-5 text-red-600" />}
                          {notification.type === 'file_uploaded' && <Upload className="w-5 h-5 text-blue-600" />}
                          {!['file_approved', 'file_rejected', 'file_uploaded'].includes(notification.type) && 
                            <FileText className="w-5 h-5 text-slate-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{notification.title}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(notification.created_date), 'd בMMM yyyy', { locale: he })}
                          </p>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Badge className="bg-lime-100 text-lime-800 border-lime-200 text-xs">חדש</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-slate-600 mb-2">אין פעילות אחרונה</h3>
                  <p className="text-sm text-slate-400">התחל להעלות קבצים כדי לראות פעילות כאן</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t">
              <Link to={createPageUrl("Notifications")} className="w-full">
                <Button variant="outline" className="w-full hover:bg-lime-50 hover:text-lime-700 hover:border-lime-200 transition-colors">
                  הצג את כל הפעילויות
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Inquiries Widget */}
          <Card className="border-0 shadow-lg bg-white flex flex-col">
            <CardHeader className="border-b bg-slate-50/50 p-4 rounded-t-lg">
              <div className="flex items-end justify-between">
                <CardTitle className="text-xl dark:text-slate-900">פניות אחרונות</CardTitle>
                <Link to={createPageUrl("TrackInquiries?new=true")}>
                  <Button variant="outline" size="xs" className="hover:bg-lime-50 hover:text-lime-700 hover:border-lime-200 transition-colors text-xs px-2 py-1">
                    <Plus className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              {recentInquiries.length > 0 ? (
                <div className="space-y-3">
                  {recentInquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm truncate max-w-32">{inquiry.subject}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(inquiry.created_date), 'd בMMM yyyy', { locale: he })}
                          </p>
                        </div>
                      </div>
                      {getInquiryStatusBadge(inquiry.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-slate-600 mb-2">אין פניות</h3>
                  <p className="text-sm text-slate-400">שלח פנייה חדשה למנהלי המערכת</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t">
              <Link to={createPageUrl("TrackInquiries")} className="w-full">
                <Button variant="outline" className="w-full hover:bg-lime-50 hover:text-lime-700 hover:border-lime-200 transition-colors">
                  הצג את כל הפניות
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Quick Actions and Performance */}
          <div className="space-y-4">
            {/* Quick Actions Card */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="p-4">
                <CardTitle className="text-xl dark:text-slate-900">פעולות מהירות</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex flex-col gap-3">
                  <Link to={createPageUrl("UploadFile")}>
                    <Button className="w-full justify-start bg-lime-500 text-white border border-lime-500 hover:bg-lime-100 hover:text-lime-700 hover:border-lime-200 transition-colors">
                      <Upload className="w-4 h-4 ml-2" />
                      העלאת קובץ חדש
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Courses")}>
                    <Button variant="outline" className="w-full justify-start hover:bg-lime-100 hover:text-lime-700 hover:border-lime-200 transition-colors">
                      <BookOpen className="w-4 h-4 ml-2" />
                      עיון בקורסים
                    </Button>
                  </Link>
                  <Link to={createPageUrl("MyFiles")}>
                    <Button variant="outline" className="w-full justify-start hover:bg-lime-100 hover:text-lime-700 hover:border-lime-200 transition-colors">
                      <FileText className="w-4 h-4 ml-2" />
                      הקבצים שלי
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="p-4">
                <CardTitle className="text-xl dark:text-slate-900">ביצועים</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">קבצים שאושרו</span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-900">{stats.approvedFiles}/{stats.totalFiles}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-lime-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.totalFiles > 0 ? (stats.approvedFiles / stats.totalFiles) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <Link to={createPageUrl("Insights")}>
                    <Button variant="ghost" className="text-xs text-slate-500 hover:text-lime-700 hover:bg-lime-50 px-2 py-1 h-auto font-normal">
                      צפייה בתובנות
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
