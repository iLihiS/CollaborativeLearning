
import React, { useState, useEffect } from 'react';
import { File } from '@/api/entities';
import { Course } from '@/api/entities';
import { Student } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, Download, BookOpen, FileText, Crown, Award } from 'lucide-react';

const fileTypeToHebrew = {
  note: "הרצאות וסיכומים",
  exam: "מבחני תרגול",
  formulas: "דף נוסחאות",
  assignment: "מטלות",
  other: "אחר"
};

export default function Insights() {
  const [popularFiles, setPopularFiles] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [currentUserStats, setCurrentUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const [allFiles, allCourses, allStudents, currentUser] = await Promise.all([
        File.list('-download_count'),
        Course.list(),
        Student.list(),
        User.me(),
      ]);

      // Popular Files - only approved files
      const approvedFiles = allFiles.filter(file => file.status === 'approved');
      setPopularFiles(approvedFiles.slice(0, 8));

      // Popular Courses
      const courseFileCounts = approvedFiles.reduce((acc, file) => {
        acc[file.course_id] = (acc[file.course_id] || 0) + 1;
        return acc;
      }, {});
      
      const sortedCourseIds = Object.keys(courseFileCounts).sort((a, b) => courseFileCounts[b] - courseFileCounts[a]);
      
      const popularCoursesData = sortedCourseIds.slice(0, 8).map(courseId => {
        const course = allCourses.find(c => c.id === courseId);
        return {
          ...course,
          fileCount: courseFileCounts[courseId]
        };
      }).filter(course => course && course.course_name);

      setPopularCourses(popularCoursesData);

      // Top 3 Students
      const uploadCounts = allFiles.reduce((acc, file) => {
        if (file.uploaded_by) {
            acc[file.uploaded_by] = (acc[file.uploaded_by] || 0) + 1;
        }
        return acc;
      }, {});

      const studentsMap = allStudents.reduce((acc, student) => {
          acc[student.student_id] = student.full_name;
          return acc;
      }, {});

      const sortedStudentIds = Object.keys(uploadCounts).sort((a, b) => uploadCounts[b] - uploadCounts[a]);
      
      const topStudentsData = sortedStudentIds.slice(0, 3).map(studentId => ({
          id: studentId,
          name: studentsMap[studentId] || 'סטודנט לא ידוע',
          count: uploadCounts[studentId]
      }));
      setTopStudents(topStudentsData);
      
      // Current user stats
      const currentStudent = allStudents.find(s => s.email === currentUser.email);
      if(currentStudent) {
          const count = uploadCounts[currentStudent.student_id] || 0;
          const rank = sortedStudentIds.indexOf(currentStudent.student_id) + 1;
          const uploadsToFirst = topStudentsData.length > 0 ? (topStudentsData[0].count - count) : 0;
          
          setCurrentUserStats({
              studentId: currentStudent.student_id,
              isTopThree: rank > 0 && rank <= 3,
              uploadsToFirst: uploadsToFirst > 0 ? uploadsToFirst : 0,
          });
      }

    } catch (error) {
      console.error("Error loading insights:", error);
    }
    setLoading(false);
  };

  const handleDownload = async (file) => {
    // Increment download count
    await File.update(file.id, { download_count: (file.download_count || 0) + 1 });
    // Open file url
    window.open(file.file_url, '_blank');
    // Reload data to show updated download count
    loadInsights();
  };

  const LoadingTable = () => (
    <div className="space-y-3">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex justify-between items-center p-4 rounded-lg bg-slate-50 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="w-12 h-6 bg-slate-200 rounded-full"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen" dir="rtl">
      <style>{`
        .fireworks-bg {
          position: relative;
          overflow: hidden;
        }
        .fireworks-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle, white 0.5px, transparent 1px),
            radial-gradient(circle, white 0.5px, transparent 1px);
          background-size: 30px 30px, 40px 40px;
          background-position: 0 0, 20px 20px;
          animation: sparkle 2s infinite linear;
          opacity: 0;
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-200">תובנות המערכת</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300 mt-2">גלה את החומרים והקורסים הפופולריים ביותר</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Popular Files */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 flex flex-col">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-700/50 rounded-t-lg py-3">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg">
                <div className="w-7 h-7 bg-lime-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-lime-600" />
                </div>
                הקבצים הפופולריים ביותר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow h-96 overflow-y-auto">
              {loading ? <LoadingTable /> : (
                <div className="space-y-2">
                  {popularFiles.length > 0 ? popularFiles.map((file, index) => (
                    <div key={file.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:bg-lime-50/50 hover:border-lime-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-lime-800 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-lime-100 dark:bg-slate-600 rounded-full text-lime-700 dark:text-lime-300 font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-200 text-sm leading-tight">{file.title}</p>
                          <Badge variant="secondary" className="mt-1 text-xs dark:bg-slate-600 dark:text-slate-300">{fileTypeToHebrew[file.file_type] || file.file_type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex items-center gap-2 bg-lime-700 hover:bg-lime-800 text-white px-3 py-1.5 rounded-full transition-all duration-200 font-semibold text-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>{file.download_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">אין עדיין קבצים פופולריים</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Courses */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 flex flex-col">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-700/50 rounded-t-lg py-3">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg">
                <div className="w-7 h-7 bg-lime-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-lime-600" />
                </div>
                הקורסים הפעילים ביותר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow h-96 overflow-y-auto">
              {loading ? <LoadingTable /> : (
                <div className="space-y-2">
                  {popularCourses.length > 0 ? popularCourses.map((course, index) => (
                    <div key={course.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:bg-lime-50/50 hover:border-lime-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-lime-800 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 bg-lime-100 dark:bg-slate-600 rounded-full text-lime-700 dark:text-lime-300 font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-lime-500" />
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-200 text-sm leading-tight">{course.course_name}</p>
                            <Badge variant="outline" className="mt-1 text-xs font-mono dark:border-slate-600 dark:text-slate-300">{course.course_code}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-full">
                        <FileText className="w-3 h-3 text-lime-500" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{course.fileCount}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">אין עדיין קורסים פעילים</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

           {/* Top Students Podium */}
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white dark:bg-slate-800">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg">
                <div className="w-7 h-7 bg-lime-100 rounded-lg flex items-center justify-center">
                  <Award className="w-4 h-4 text-lime-600" />
                </div>
                הסטודנטים המשתפים ביותר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="h-44 flex justify-center items-center">
                  <p className="dark:text-slate-300">טוען נתונים...</p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row justify-around items-center lg:items-end gap-4 h-auto lg:h-44">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center w-full lg:w-1/3 order-2 lg:order-1">
                    <p className="font-bold text-sm text-lime-700 dark:text-lime-300 mb-1">מקום 2</p>
                    <div className={`w-full bg-lime-300 dark:bg-lime-800/50 h-24 rounded-lg flex flex-col justify-center items-center text-center p-2 relative ${topStudents[1]?.id === currentUserStats?.studentId ? 'fireworks-bg' : ''}`}>
                      {topStudents[1] ? (
                        <>
                          <p className="font-bold text-lime-800 dark:text-lime-200 text-xs">{topStudents[1].name}</p>
                          <p className="text-xs text-lime-700 dark:text-lime-300">{topStudents[1].count} קבצים</p>
                        </>
                      ) : (
                        <p className="text-xs text-lime-600 dark:text-lime-400">המקום עדיין פנוי!</p>
                      )}
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center w-full lg:w-1/3 order-1 lg:order-2">
                    <Crown className="w-6 h-6 text-lime-500 mb-1" />
                    <div className={`w-full bg-lime-500 dark:bg-lime-600 h-32 rounded-lg flex flex-col justify-center items-center text-center p-2 shadow-lg relative ${topStudents[0]?.id === currentUserStats?.studentId ? 'fireworks-bg' : ''}`}>
                       {topStudents[0] ? (
                        <>
                          <p className="font-bold text-white text-sm">{topStudents[0].name}</p>
                          <p className="text-xs text-lime-100">{topStudents[0].count} קבצים</p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-white">המקום הראשון מחכה!</p>
                      )}
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center w-full lg:w-1/3 order-3 lg:order-3">
                    <p className="font-bold text-sm text-lime-600 dark:text-lime-400 mb-1">מקום 3</p>
                    <div className={`w-full bg-lime-200 dark:bg-lime-900/60 h-20 rounded-lg flex flex-col justify-center items-center text-center p-2 relative ${topStudents[2]?.id === currentUserStats?.studentId ? 'fireworks-bg' : ''}`}>
                       {topStudents[2] ? (
                        <>
                          <p className="font-bold text-lime-800 dark:text-lime-300 text-xs">{topStudents[2].name}</p>
                          <p className="text-xs text-lime-700 dark:text-lime-400">{topStudents[2].count} קבצים</p>
                        </>
                      ) : (
                         <p className="text-xs text-lime-700 dark:text-lime-500">המקום עדיין פנוי!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
        
        {topStudents.length === 0 && !loading && (
             <div className="mt-4 text-white bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                המקומות על הפודיום עדיין לא נתפסו, <span className="font-bold text-lime-400">מהרו לתפוס!</span>
            </div>
        )}

        {currentUserStats && !currentUserStats.isTopThree && currentUserStats.uploadsToFirst > 0 && !loading && (
            <div className="mt-4 text-white bg-lime-700 p-3 rounded-lg text-center">
                את/ה במרחק של <span className="font-bold text-lime-100">{currentUserStats.uploadsToFirst}</span> קבצים בלבד מהמקום הראשון. המשיכו כך!
            </div>
        )}
        
        {currentUserStats && currentUserStats.isTopThree && !loading && (
             <div className="mt-4 text-white bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                <span className="font-bold text-lime-400">כל הכבוד!</span> אתם בראש הטבלה, המשיכו להוביל!
            </div>
        )}

      </div>
    </div>
  );
}
