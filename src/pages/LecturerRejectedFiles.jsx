import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Lecturer } from '@/api/entities';
import { File } from '@/api/entities';
import { Course } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';


export default function LecturerRejectedFiles() {
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();

      const [allFiles, allCourses] = await Promise.all([
          File.filter({ status: 'rejected' }),
          Course.list()
      ]);

      let filesToDisplay = allFiles;

      if (currentUser.current_role !== 'admin') {
        const lecturerRecords = await Lecturer.filter({ email: currentUser.email });
        const currentLecturer = lecturerRecords[0];

        if (currentLecturer) {
          const lecturerCourseIds = allCourses
            .filter(c => c.lecturer_id === currentLecturer.id)
            .map(c => c.id);
          filesToDisplay = allFiles.filter(f => lecturerCourseIds.includes(f.course_id));
        } else {
          filesToDisplay = [];
        }
      }

      setRejectedFiles(filesToDisplay);

      const cMap = allCourses.reduce((acc, course) => {
          acc[course.id] = course.course_name;
          return acc;
      }, {});
      setCoursesMap(cMap);
    } catch (error) {
      console.error("Error loading rejected files:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
            <div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <XCircle className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">קבצים שנדחו</h1>
                </div>
                <p className="text-white mt-3">רשימת כל חומרי הלימוד שנדחו על ידך</p>
            </div>
        </div>

        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-0">
            {loading ? <p className="p-6 text-center">טוען קבצים...</p> : rejectedFiles.length > 0 ? (
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>שם קובץ</TableHead>
                      <TableHead>קורס</TableHead>
                      <TableHead>תאריך דחייה</TableHead>
                      <TableHead>סיבת הדחייה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedFiles.map(file => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">{file.title}</TableCell>
                        <TableCell>{coursesMap[file.course_id] || 'לא ידוע'}</TableCell>
                        <TableCell>{format(new Date(file.updated_date), 'd MMM yyyy', { locale: he })}</TableCell>
                        <TableCell>
                          {file.lecturer_notes ? (
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400"/>
                                <span>{file.lecturer_notes}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">לא צוינה סיבה</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
                <div className="text-center py-12">
                    <XCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800">אין קבצים שנדחו</h3>
                    <p className="text-slate-500 mt-2">לא דחית קבצים עדיין.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
