
import { useState, useEffect } from "react";
import { Course as CourseEntity } from "@/api/entities";
import { File as FileEntity } from "@/api/entities";
import { Lecturer } from "@/api/entities";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Upload, Download, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const fileTypeToHebrew = {
  note: "הרצאות וסיכומים",
  exam: "מבחני תרגול",
  formulas: "דף נוסחאות",
  assignment: "מטלות",
  other: "אחר"
};

export default function CoursePage() {
  const [course, setCourse] = useState(null);
  const [lecturer, setLecturer] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New state for error handling
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const courseId = searchParams.get('id');
  const fromTrack = searchParams.get('track');
  const fromSearch = searchParams.get('search');


  useEffect(() => {
    if (courseId) {
      loadCourseData(courseId);
    } else {
      navigate(createPageUrl("Courses"));
    }
  }, [courseId]);

  const loadCourseData = async (courseId) => {
    try {
      setError(null); // Clear any previous errors
      const courseData = await CourseEntity.get(courseId);
      setCourse(courseData);

      // Handle lecturer lookup with better error handling
      if (courseData.lecturer_id) {
        try {
          const lecturerData = await Lecturer.get(courseData.lecturer_id);
          setLecturer(lecturerData);
        } catch (lecturerError) {
          console.warn(`Lecturer with ID ${courseData.lecturer_id} not found:`, lecturerError);
          // Set a placeholder lecturer object if fetching fails
          setLecturer({
            id: courseData.lecturer_id,
            full_name: 'מרצה לא זמין',
            email: 'לא זמין'
          });
        }
      } else {
        // Set a placeholder lecturer object if no lecturer ID is provided
        setLecturer({
          id: 'unknown',
          full_name: 'לא שויך מרצה',
          email: 'לא זמין'
        });
      }

      const approvedFiles = await FileEntity.filter({ course_id: courseId, status: 'approved' });
      setFiles(approvedFiles);

    } catch (error) {
      console.error("Error loading course data:", error);
      setError("שגיאה בטעינת נתוני הקורס. אנא נסו שוב מאוחר יותר."); // Set a user-friendly error message
    }
    setLoading(false);
  };

  const handleDownload = async (file) => {
    // Increment download count
    await FileEntity.update(file.id, { download_count: (file.download_count || 0) + 1 });
    // Open file url
    window.open(file.file_url, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8" dir="rtl">
        <div className="h-40 bg-slate-200 rounded-lg animate-pulse mb-8"></div>
        <div className="h-96 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) { // Display error message if an error occurred
    return (
      <div className="p-8 text-center" dir="rtl">
        <h2 className="text-2xl font-bold text-red-600 mb-2">שגיאה בטעינת הקורס</h2>
        <p className="mt-2 text-slate-600">{error}</p>
        <Link to={createPageUrl("Courses")}>
          <Button className="mt-4">חזרה לרשימת הקורסים</Button>
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <h2 className="text-2xl font-bold">קורס לא נמצא</h2>
        <p className="mt-2">לא הצלחנו למצוא את הקורס המבוקש.</p>
        <Link to={createPageUrl("Courses")}>
          <Button className="mt-4">חזרה לרשימת הקורסים</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl(`Courses?track=${fromTrack || ''}&search=${fromSearch || ''}`)}>
            <Button variant="outline" className="hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לרשימת הקורסים
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600 text-white relative overflow-hidden shimmer-effect">
          <div className="absolute inset-0 bg-black/10 z-0"></div>
          <CardContent className="p-8 relative">
            <h1 className="text-4xl font-bold">{course.course_name}</h1>
            <p className="text-lg opacity-80 mt-1">{course.course_code}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-lime-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{lecturer?.full_name || 'מרצה לא ידוע'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{course.semester}</span>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-lime-50">{course.description}</p>
          </CardContent>
        </Card>

        {/* Available Materials Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-lime-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-lime-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200">חומרי לימוד זמינים</h2>
        </div>

        {/* Files Card */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-0">
            {files.length > 0 ? (
              <div className="grid gap-4 p-6">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-lime-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{file.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{file.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className="text-xs bg-lime-100 text-lime-800 border-lime-200">
                            {fileTypeToHebrew[file.file_type] || file.file_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-slate-600">
                            {format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(file)}
                      className="bg-lime-500 hover:bg-lime-600 text-white"
                    >
                      <Download className="w-4 h-4 ml-2" />
                      הורדה
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">אין עדיין חומרי לימוד</h3>
                <p className="text-slate-600 mb-6">היה הראשון להעלות חומר לימוד לקורס זה!</p>
                <Link to={createPageUrl(`UploadFile?course_id=${course.id}`)}>
                  <Button className="bg-lime-500 hover:bg-lime-600 text-white">
                    <Upload className="w-4 h-4 ml-2" />
                    העלה קובץ ראשון
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
