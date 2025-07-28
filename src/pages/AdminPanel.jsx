
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Book, FileText, GraduationCap, Settings, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User } from '@/api/entities';
import { Student } from '@/api/entities';
import { Lecturer } from '@/api/entities';

export default function AdminPanel() {
  const [userRoles, setUserRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      const currentUser = await User.me();
      const [studentRecords, lecturerRecords] = await Promise.all([
        Student.filter({ email: currentUser.email }),
        Lecturer.filter({ email: currentUser.email }),
      ]);

      const roles = [];
      if (studentRecords.length > 0) roles.push('student');
      if (lecturerRecords.length > 0) roles.push('lecturer');
      // For testing - assume current user can be admin
      roles.push('admin');
      setUserRoles(roles);
    } catch (error) {
      console.error("Error loading user roles:", error);
    }
  };

  const switchRole = async (newRole) => {
    try {
      await User.updateMyUserData({ current_role: newRole });
      if (newRole === 'student') {
        navigate(createPageUrl('Dashboard'));
      } else if (newRole === 'lecturer') {
        navigate(createPageUrl('LecturerPendingFiles'));
      }
      // If switching to admin, stay on AdminPanel
    } catch (error) {
      console.error("Error switching role:", error);
    }
  };

  const adminLinks = [
    { title: "ניהול סטודנטים", icon: Users, url: "AdminStudentManagement", description: "הוספה, עריכה ומחיקה של סטודנטים" },
    { title: "ניהול קורסים", icon: Book, url: "AdminCourseManagement", description: "ניהול קורסים וסמסטרים" },
    { title: "ניהול קבצים", icon: FileText, url: "AdminFileManagement", description: "צפייה וניהול של כל הקבצים במערכת" },
    { title: "ניהול מרצים", icon: GraduationCap, url: "AdminLecturerManagement", description: "הוספה וניהול של סגל המרצים" },
    { title: "ניהול מנהלים", icon: Settings, url: "AdminManagement", description: "ניהול מנהלי המערכת והרשאותיהם" },
  ];

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">פאנל ניהול</h1>
            </div>
            <p className="text-white mt-3">ניהול מרכזי של כל רכיבי המערכת</p>
          </div>

          {userRoles.length > 1 && (
            <div className="flex items-start">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="px-6 py-2 h-auto text-base">
                    <Settings className="w-4 h-4 ml-2" />
                    מנהל
                    <ChevronDown className="w-4 h-4 mr-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userRoles.filter(r => r !== 'admin').map(role => {
                    if (role === 'student') return <DropdownMenuItem key="student" onClick={() => switchRole('student')}>מעבר לתצוגת סטודנט</DropdownMenuItem>
                    if (role === 'lecturer') return <DropdownMenuItem key="lecturer" onClick={() => switchRole('lecturer')}>מעבר לתצוגת מרצה</DropdownMenuItem>
                    return null;
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminLinks.map((link) => (
            <Link to={createPageUrl(link.url)} key={link.title} className="group block h-full">
              <Card className="border border-transparent shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 h-full group-hover:bg-lime-50 group-hover:border-lime-200 bg-white">
                <CardHeader>
                  <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-lime-200">
                    <link.icon className="w-6 h-6 text-lime-700 transition-colors duration-300 group-hover:text-lime-800" />
                  </div>
                  <CardTitle className="text-black transition-colors duration-300 group-hover:text-lime-800">{link.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-slate-400">{link.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
