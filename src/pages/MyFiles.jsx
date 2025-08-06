
import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Student } from "@/api/entities";
import { File } from "@/api/entities";
import { Course } from "@/api/entities";
import { Lecturer } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Edit, Trash2, Clock, CheckCircle, XCircle, Plus, Filter, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const fileTypeToHebrew = {
  note: "הרצאות וסיכומים",
  exam: "מבחני תרגול",
  formulas: "דף נוסחאות",
  assignment: "מטלות",
  other: "אחר"
};

export default function MyFiles() {
  const [files, setFiles] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadMyFiles();
  }, []);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusFromUrl = urlParams.get('status');
    if (statusFromUrl && ['pending', 'approved', 'rejected'].includes(statusFromUrl)) {
      setFilter(statusFromUrl);
    } else {
        setFilter('all');
    }
  }, [location.search]);

  const loadMyFiles = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      let uploaderId = null;

      if (currentUser.current_role === 'student') {
          const students = await Student.filter({ email: currentUser.email });
          if (students.length > 0) {
              uploaderId = students[0].id;
          }
      } else if (currentUser.current_role === 'lecturer') {
          const lecturers = await Lecturer.filter({ email: currentUser.email });
          if (lecturers.length > 0) {
              uploaderId = lecturers[0].id;
          }
      }

      if (uploaderId) {
        const [userFiles, allCourses] = await Promise.all([
          File.filter({ uploader_id: uploaderId }, "-created_date"),
          Course.list()
        ]);
        
        const coursesMap = allCourses.reduce((acc, course) => {
          acc[course.id] = course;
          return acc;
        }, {});
        
        setFiles(userFiles);
        setCourses(coursesMap);
      } else {
        setFiles([]);
        setCourses({});
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
    setLoading(false);
  };
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    const url = newFilter === 'all' ? createPageUrl("MyFiles") : createPageUrl(`MyFiles?status=${newFilter}`);
    navigate(url, { replace: true });
  }

  const handleDelete = async (fileId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק קובץ זה?")) {
      try {
        await File.delete(fileId);
        setFiles(files.filter(f => f.id !== fileId));
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert("שגיאה במחיקת הקובץ.");
      }
    }
  };

  const getStatusComponent = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 ml-1" />אושר</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 ml-1" />נדחה</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 ml-1" />ממתין</Badge>;
    }
  };

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    return file.status === filter;
  });
  
  const emptyStateMessages = {
      all: 'עדיין לא העליתם קבצים.',
      pending: 'אין קבצים הממתינים לאישור.',
      approved: 'אין קבצים שאושרו.',
      rejected: 'אין קבצים שנדחו.'
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
            <div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">הקבצים שלי</h1>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-3">נהלו את הקבצים שהעליתם למערכת</p>
            </div>
            <div>
                <Link to={createPageUrl("UploadFile")}>
                    <Button className="bg-lime-500 hover:bg-lime-600 text-white w-full md:w-auto">
                        <Plus className="w-4 h-4 ml-2" />
                        העלאת קובץ חדש
                    </Button>
                </Link>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <p className="font-medium text-slate-800 dark:text-slate-200">סנן לפי סטטוס:</p>
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} className={filter === 'all' ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'dark:text-slate-200 dark:border-slate-600'} onClick={() => handleFilterChange('all')}>הכל</Button>
            <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} className={filter === 'pending' ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'dark:text-slate-200 dark:border-slate-600'} onClick={() => handleFilterChange('pending')}>ממתין</Button>
            <Button size="sm" variant={filter === 'approved' ? 'default' : 'outline'} className={filter === 'approved' ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'dark:text-slate-200 dark:border-slate-600'} onClick={() => handleFilterChange('approved')}>אושר</Button>
            <Button size="sm" variant={filter === 'rejected' ? 'default' : 'outline'} className={filter === 'rejected' ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'dark:text-slate-200 dark:border-slate-600'} onClick={() => handleFilterChange('rejected')}>נדחה</Button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                  <p className="mt-4 text-slate-500 dark:text-slate-400">טוען קבצים...</p>
                </div>
              ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-700">
                            <TableRow className="hover:bg-slate-100 dark:hover:bg-slate-600">
                              <TableHead className="text-right text-slate-800 dark:text-slate-300">שם הקובץ</TableHead>
                              <TableHead className="text-right text-slate-800 dark:text-slate-300">קורס</TableHead>
                              <TableHead className="text-right text-slate-800 dark:text-slate-300">סוג</TableHead>
                              <TableHead className="text-right text-slate-800 dark:text-slate-300">תאריך העלאה</TableHead>
                              <TableHead className="text-right text-slate-800 dark:text-slate-300">סטטוס</TableHead>
                              <TableHead className="text-right text-slate-800 dark:text-slate-300">פעולות</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="dark:text-slate-200">
                            {filteredFiles.length > 0 ? (
                              filteredFiles.map((file) => (
                                <TableRow key={file.id} className="dark:border-slate-700">
                                  <TableCell className="font-medium">{file.title}</TableCell>
                                  <TableCell>{courses[file.course_id]?.course_name || 'לא ידוע'}</TableCell>
                                  <TableCell>{fileTypeToHebrew[file.file_type] || file.file_type}</TableCell>
                                  <TableCell>{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                                  <TableCell>{getStatusComponent(file.status)}</TableCell>
                                  <TableCell>
                                    {file.status === 'pending' && (
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(file.id)}>
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-16 text-slate-500 dark:text-slate-400">
                                  {emptyStateMessages[filter]}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
           {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                <p className="mt-4 text-slate-500">טוען קבצים...</p>
              </div>
           ) : filteredFiles.length > 0 ? (
             filteredFiles.map((file) => (
                <Card key={file.id} className="border-0 shadow-lg bg-white dark:bg-slate-800">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className="text-slate-900 dark:text-slate-100 text-base leading-tight">{file.title}</span>
                      {getStatusComponent(file.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <BookOpen className="w-4 h-4"/>
                      <span>{courses[file.course_id]?.course_name || 'לא ידוע'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <FileText className="w-4 h-4"/>
                      <span>{fileTypeToHebrew[file.file_type] || file.file_type}</span>
                    </div>
                     <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-4 h-4"/>
                      <span>{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</span>
                    </div>
                  </CardContent>
                  {file.status === 'pending' && (
                    <CardFooter>
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" size="sm" disabled className="w-full cursor-not-allowed">
                          <Edit className="w-4 h-4 ml-2" />
                          עריכה
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(file.id)} className="w-full">
                          <Trash2 className="w-4 h-4 ml-2" />
                          מחיקה
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
             ))
           ) : (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p>{emptyStateMessages[filter]}</p>
            </div>
           )}
        </div>


        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400 text-right space-y-1">
            <p><span className="font-bold">הערה:</span> ניתן לערוך או למחוק קבצים רק כל עוד הם במצב &quot;ממתין לאישור&quot;.</p>
            <p>קבצים שנדחו יציגו את הערת המרצה (אם קיימת) בדף הקובץ.</p>
        </div>

      </div>
    </div>
  );
}
