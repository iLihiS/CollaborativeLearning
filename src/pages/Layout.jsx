

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  Home,
  Upload,
  BookOpen,
  FileText,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Settings,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Bell,
  Clock, // Added Clock icon import for lecturer pending files
  CheckCircle, // Added CheckCircle icon import for lecturer approved files
  XCircle as XCircleIcon // Renamed to avoid conflict with X component
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import AccessibilityWidget from '@/components/AccessibilityWidget';

// eslint-disable-next-line react/prop-types
export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'למידה שיתופית בקריה האקדמית אונו';
    
    const faviconUrl = 'https://yedion.ono.ac.il/info/images/Favicon.ico';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, []);

  useEffect(() => {
    loadUser();
  }, [location.pathname]); // Reload user on path change to update role view

  const loadUser = async () => {
    setLoading(true);
    
    // Check if we have a valid token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // No token means user should login
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      // Apply theme on load
      const theme = currentUser.theme_preference || localStorage.getItem('theme') || 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch {
      console.log("User not authenticated");
      // Clear any stored authentication data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('mock_user');
      setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      toast({
        title: "התנתקות מוצלחת",
        description: "התנתקת בהצלחה מהמערכת",
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      toast({
        title: "התנתקות הושלמה",
        description: "נתוני המערכת נוקו בהצלחה",
      });
    }
    // Clear all component state
    setUser(null);
    setLoading(false); // Set to false so login screen shows immediately
    // Short delay to show the toast
    setTimeout(() => {
      // Don't redirect, just clear user state to show login screen
      setUser(null);
    }, 1000);
  };

  const getNavigationItems = () => {
    if (!user) return [];

    // Get current role with fallback priority: student -> lecturer -> admin
    const currentRole = user.current_role || (user.role === 'admin' ? 'admin' : (user.role === 'lecturer' ? 'lecturer' : 'student'));

    // Define all navigation items with their respective roles
    const allNavItems = [
      // Common items for Student, Lecturer, Admin
      { title: "דף הבית", url: createPageUrl("Dashboard"), icon: Home, roles: ["student", "lecturer", "admin"] },
      { title: "הקבצים שלי", url: createPageUrl("MyFiles"), icon: FileText, roles: ["student", "lecturer", "admin"] },
      { title: "קורסים", url: createPageUrl("Courses"), icon: BookOpen, roles: ["student", "lecturer", "admin"] },
      { title: "העלאת קובץ", url: createPageUrl("UploadFile"), icon: Upload, roles: ["student", "lecturer", "admin"] },
      { title: "תובנות", url: createPageUrl("Insights"), icon: BarChart3, roles: ["student", "lecturer", "admin"] },
      { title: "התראות", url: createPageUrl("Notifications"), icon: Bell, roles: ["student", "lecturer", "admin"] },
      { title: "מעקב פניות", url: createPageUrl("TrackInquiries"), icon: MessageSquare, roles: ["student", "lecturer", "admin"] },
      { title: "עזרה", url: createPageUrl("Help"), icon: HelpCircle, roles: ["student", "lecturer", "admin"] },
      
      // Lecturer specific items (also accessible by Admin)
      { title: "קבצים ממתינים", url: createPageUrl("LecturerPendingFiles"), icon: Clock, roles: ["lecturer", "admin"] },
      { title: "קבצים מאושרים", url: createPageUrl("LecturerApprovedFiles"), icon: CheckCircle, roles: ["lecturer", "admin"] },
      { title: "קבצים שנדחו", url: createPageUrl("LecturerRejectedFiles"), icon: XCircleIcon, roles: ["lecturer", "admin"] },
      
      // Admin specific item
      { title: "פאנל ניהול", url: createPageUrl("AdminPanel"), icon: Settings, roles: ["admin"] },
    ];

    // Filter items based on the current user's role
    const filteredNavLinks = allNavItems.filter(item => item.roles.includes(currentRole));
    
    return filteredNavLinks;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full">
          <div className="w-24 h-24 p-1 border-2 border-lime-200 dark:border-lime-700 rounded-full mx-auto mb-6 flex items-center justify-center bg-lime-500">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-12 h-12">
               <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
             </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ברוכים הבאים ללמידה שיתופית</h1>
          <p className="text-lg font-medium text-lime-600 dark:text-lime-400 mt-1 mb-8">בקריה האקדמית אונו</p>
          
          <Button
            onClick={async () => {
              try {
                setLoading(true);
                await User.login();
                // After successful login, reload user data
                await loadUser();
              } catch (error) {
                console.error('Login failed:', error);
                setLoading(false);
              }
            }}
            variant="outline"
            className="w-full border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
            size="lg"
            disabled={loading}
          >
            <svg className="ml-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 62.3l-66.5 64.6C305.5 102.6 277.6 88 248 88c-86.1 0-156 70-156 156s70 156 156 156c97.2 0 132.1-64.4 135.6-95.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            התחברות עם Google
          </Button>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
            אין לך חשבון? ההרשמה למערכת מתבצעת על ידי מנהל בלבד.
          </p>
        </div>
      </div>
    );
  }

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <style>{`
        :root {
          --bg-primary: #f8fafc;
          --bg-card: #ffffff;
          --bg-sidebar: rgba(255, 255, 255, 0.95);
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-muted: #94a3b8;
          --border-color: #e2e8f0;
          --lime-primary: #84cc16;
          --lime-secondary: #65a30d;
        }

        .dark {
          --bg-primary: #212121; /* רקע כללי */
          --bg-card: #E0E0E0; /* רקע כרטיסיות - Changed to light grey */
          --bg-sidebar: rgba(224, 224, 224, 0.95); /* סרגל צד תואם - Changed to light grey */
          --text-primary: #1e293b; /* טקסט כהה על כרטיסיות בהירות */
          --text-secondary: #374151;
          --text-muted: #64748b;
          --border-color: #424242; /* גבולות עדינים */
          --lime-primary: #65a30d;
          --lime-secondary: #4d7c0f;
        }

        .glass-effect {
          backdrop-filter: blur(12px);
          background: var(--bg-sidebar);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .smooth-transition {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-item:hover {
          transform: translateX(-4px);
        }

        * {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
          direction: rtl;
          background-color: var(--bg-primary);
        }

        /* החלת צבעי הרקע */
        .bg-slate-50 {
          background-color: var(--bg-primary);
        }

        .bg-white {
          background-color: var(--bg-card);
        }
        
        /* שם המשתמש יישאר שחור תמיד */
        .dark .user-name {
          color: #1e293b !important;
        }

        /* צבע טקסט קטגוריות בסיידבר במצב כהה */
        .dark .nav-item {
          color: #212121;
        }

        /* גבולות במצב כהה */
        .dark .border-slate-200 {
          border-color: var(--border-color);
        }

        .dark .border-slate-700 {
          border-color: var(--border-color);
        }

        /* רקעי gray במצב כהה */
        .dark .bg-slate-100 {
          background-color: #2d2d2d; /* גוון מעט בהיר יותר מרקע */
        }

        .dark .bg-slate-50 {
          background-color: var(--bg-primary);
        }

        .dark .bg-slate-800 {
          background-color: var(--bg-card);
        }
        
        .dark .hover\\:bg-slate-50:hover {
          background-color: #4b5563; /* gray-600 */
        }

        .dark .hover\\:bg-slate-100:hover {
          background-color: #6b7280; /* gray-500 */
        }

        /* צבעי lime במצב כהה - נשארים ירוקים אבל כהים יותר */
        .dark .bg-lime-500 {
          background-color: var(--lime-primary);
        }

        .dark .bg-lime-600 {
          background-color: var(--lime-secondary);
        }

        .dark .hover\\:bg-lime-600:hover {
          background-color: var(--lime-secondary);
        }

        .dark .bg-gradient-to-r.from-lime-500.to-lime-600 {
          background: linear-gradient(to left, var(--lime-secondary), var(--lime-primary));
        }

        /* צבעי lime לטקסט */
        .dark .text-lime-600 {
          color: #a3e635; /* lime-400 - בהיר יותר לניגודיות */
        }

        .dark .text-lime-400 {
          color: #a3e635;
        }

        /* הוברים במצב כהה */
        .dark .hover\\:bg-slate-50:hover {
          background-color: #4b5563; /* gray-600 */
        }

        .dark .hover\\:bg-slate-100:hover {
          background-color: #6b7280; /* gray-500 */
        }
        
        .dark .hover\\:border-lime-200:hover {
          border-color: #65a30d; /* lime-700 */
        }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden glass-effect border-b sticky top-0 z-50 dark:border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-lime-500 to-lime-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">למידה שיתופית</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="smooth-transition dark:text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t bg-white/95 backdrop-blur-sm dark:bg-slate-800/95 dark:border-slate-700">
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition ${
                    location.pathname === item.url
                      ? 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
              <Link
                to={createPageUrl("Settings")}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg smooth-transition text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700`}
              >
                <Settings className="w-4 h-4" />
                <span className="font-medium">הגדרות</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 smooth-transition w-full"
              >
                <LogOut className="w-4 h-4 ml-2" />
                <span className="font-medium">התנתקות</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0">
          <div className="flex flex-col flex-1 glass-effect border-l shadow-xl dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-3 p-6 border-b border-slate-200/60 dark:border-slate-700 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">למידה שיתופית</h1>
                <p className="text-xs font-medium text-lime-600" style={{color: document.documentElement.classList.contains('dark') ? '#666262' : undefined}}>בקריה האקדמית אונו</p>
              </div>
            </div>

            {/* Navigation - with scroll */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`nav-item flex items-center gap-3 px-4 py-2 rounded-xl smooth-transition font-medium border ${
                    location.pathname === item.url
                      ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white border-transparent shadow-lg'
                      : 'text-slate-600 border-transparent hover:bg-[#ebfaca] hover:text-[#52820e] hover:border-[#52820e]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-200/60 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gradient-to-r from-lime-50 to-lime-100 border border-lime-200 dark:bg-slate-700 dark:border-slate-600">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-r from-lime-500 to-lime-600 text-white font-semibold">
                        {user?.full_name?.charAt(0) || 'מ'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 user-name truncate dark:text-slate-900">
                        {user?.full_name || 'משתמש'}
                      </p>
                      <p className="text-xs text-lime-600 dark:text-lime-400 truncate font-medium">{user?.email}</p>
                    </div>
                </div>
                <Link to={createPageUrl("Settings")}>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-lime-200/50 hover:text-lime-700 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-lime-400 rounded-full shrink-0">
                        <Settings className="w-5 h-5" />
                    </Button>
                </Link>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full mt-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300 smooth-transition"
              >
                <LogOut className="w-4 h-4 ml-2" />
                התנתקות
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:mr-64">
          <main className="min-h-screen">
            {children}
          </main>
        </div>
      </div>

      {/* Accessibility Widget */}
      <AccessibilityWidget />
    </div>
  );
}

