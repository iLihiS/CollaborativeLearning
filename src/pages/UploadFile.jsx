
import { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Course } from "@/api/entities";
import { File } from "@/api/entities";
import { Student } from "@/api/entities";
import { UploadFile as UploadFileIntegration } from "@/api/integrations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, X, ChevronsUpDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UploadFilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file_type: "",
    course_id: "",
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [courseComboboxOpen, setCourseComboboxOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const students = await Student.filter({ email: currentUser.email });
      const studentRecord = students[0];
      setStudent(studentRecord);

      if (studentRecord) {
        const allCourses = await Course.list();
        
        // Filter courses based on student's academic tracks
        let availableCourses = allCourses;
        if (studentRecord.academic_track) {
          const studentTracks = studentRecord.academic_track.split(', ').filter(Boolean);
          // Show courses relevant to student's tracks
          availableCourses = allCourses.filter(course => {
            // For now, show all courses if student has tracks
            // You can add specific filtering logic based on course-track relationships
            return studentTracks.length > 0;
          });
        }
        
        setCourses(availableCourses);

        const urlCourseId = new URLSearchParams(window.location.search).get('course_id');
        if (urlCourseId) {
            handleInputChange('course_id', urlCourseId);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("שגיאה בטעינת הקורסים. אנא נסה שוב.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        setError("אנא העלה קבצי PDF, DOCX, PNG או JPG בלבד");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError("גודל הקובץ חייב להיות פחות מ-10MB");
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file
      }));
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Clear the file input's value
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.title || !formData.file_type || !formData.course_id || !formData.file) {
        throw new Error("אנא מלא את כל שדות החובה");
      }

      if (!student) {
        throw new Error("פרופיל הסטודנט לא נמצא. אנא פנה למנהל המערכת.");
      }

      const uploadResult = await UploadFileIntegration(formData.file);
      
      // Check if user is in lecturer mode - if so, auto-approve the file
      const currentUser = await User.me();
      const fileStatus = currentUser.current_role === 'lecturer' ? 'approved' : 'pending';
      
      await File.create({
        title: formData.title,
        description: formData.description,
        file_type: formData.file_type,
        course_id: formData.course_id,
        file_url: uploadResult.file_url,
        uploaded_by: student.student_id,
        status: fileStatus
      });

      setSuccess(true);
      
    } catch (error) {
      setError(error.message || "שגיאה בהעלאת הקובץ. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const fileTypes = [
    { value: "note", label: "הרצאות וסיכומים" },
    { value: "exam", label: "מבחני תרגול" },
    { value: "formulas", label: "דף נוסחאות" },
    { value: "assignment", label: "מטלות" },
    { value: "other", label: "אחר" }
  ];

  if (success) {
    return (
      <div className="p-4 lg:p-8 bg-slate-50 min-h-screen flex items-center justify-center" dir="rtl">
        <div className="max-w-md w-full">
          <Card className="border-0 shadow-lg text-center">
            <CardContent className="p-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                הקובץ הועלה בהצלחה!
              </h2>
              <p className="text-slate-600 mb-6">
                {user?.current_role === 'lecturer' 
                  ? "הקובץ שלך אושר אוטומטיות וזמין כעת לכלל הסטודנטים."
                  : "הקובץ שלך הוגש לאישור המרצה. תקבל התראה ברגע שהוא ייבדק."
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setFormData({ title: "", description: "", file_type: "", course_id: "", file: null });
                  }}
                >
                  העלאת קובץ נוסף
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("MyFiles"))}
                  className="bg-slate-700 hover:bg-slate-800"
                >
                  צפייה בקבצים שלי
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">העלאת קובץ חדש</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-600 mt-3">שתפו חומרי לימוד עם סטודנטים אחרים</p>
        </div>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold text-slate-800 dark:text-white">כותרת הקובץ</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="הכנס כותרת לקובץ"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                    className="h-11 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course_id" className="font-semibold text-slate-800 dark:text-white">שיוך לקורס</Label>
                  <Popover open={courseComboboxOpen} onOpenChange={setCourseComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={courseComboboxOpen}
                        className="w-full justify-between h-11 font-normal bg-white dark:bg-slate-50 border border-slate-300 text-slate-900 dark:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                      >
                        <span className={`truncate ${!formData.course_id ? 'text-slate-500' : 'text-slate-900'}`}>
                          {formData.course_id
                            ? courses.find((course) => course.id === formData.course_id)?.course_name
                            : "בחר קורס..."}
                        </span>
                        <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" dir="rtl">
                      <Command>
                        <CommandInput placeholder="חיפוש קורס..." />
                        <CommandEmpty>לא נמצא קורס.</CommandEmpty>
                        <CommandGroup>
                          {courses.map((course) => (
                            <CommandItem
                              key={course.id}
                              value={`${course.course_code} - ${course.course_name}`}
                              onSelect={() => {
                                handleInputChange("course_id", course.id);
                                setCourseComboboxOpen(false);
                              }}
                              className="justify-between"
                            >
                              {course.course_code} - {course.course_name}
                              <Check
                                className={`ml-2 h-4 w-4 ${formData.course_id === course.id ? "opacity-100" : "opacity-0"}`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description" className="font-semibold text-slate-800 dark:text-white">תיאור (עד 200 תווים)</Label>
                  <Textarea
                    id="description"
                    placeholder="תיאור קצר של תוכן הקובץ..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    maxLength={200}
                    rows={4}
                    className="resize-none bg-white dark:bg-slate-50 border border-slate-300 text-slate-900 dark:border-slate-400 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-600 text-right">{formData.description.length}/200</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_type" className="font-semibold text-slate-800 dark:text-white">סוג הקובץ</Label>
                  <Select 
                    value={formData.file_type} 
                    onValueChange={(value) => handleInputChange("file_type", value)}
                    required
                  >
                    <SelectTrigger id="file_type" className="h-11 justify-end gap-2 bg-white dark:bg-slate-50 border border-slate-300 text-slate-900 dark:border-slate-400 data-[placeholder]:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2">
                      <SelectValue placeholder="בחר סוג" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {fileTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="font-semibold text-slate-800 dark:text-white">בחירת קובץ</Label>
                   <Input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                    />
                  {formData.file ? (
                    <div className="flex items-center justify-between p-2 pl-3 border-2 border-lime-300 dark:border-lime-400 bg-lime-50 dark:bg-lime-50/50 rounded-lg h-11">
                      <span className="text-sm text-slate-700 dark:text-slate-800 font-medium truncate" dir="ltr">
                        {formData.file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-200/50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Label
                        htmlFor="file-upload"
                        className="h-11 cursor-pointer border border-slate-300 dark:border-slate-400 hover:border-lime-300 dark:hover:border-lime-500 focus-within:ring-2 focus-within:ring-lime-500 focus-within:ring-offset-2 transition-colors rounded-lg flex items-center p-0 bg-white dark:bg-slate-50"
                        dir="rtl"
                    >
                        <div className="bg-lime-500 hover:bg-lime-600 text-white rounded-r-md px-4 text-sm font-medium h-full flex items-center">
                            בחר קובץ
                        </div>
                        <span className="px-3 text-sm text-slate-500 flex-1">
                            לא נבחר קובץ
                        </span>
                    </Label>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-600 text-right">רק קבצי PDF, DOCX, PNG, JPG מותרים.</p>
                </div>
              </div>
              
              <div className="pt-4 flex justify-start">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-lime-500 hover:bg-lime-600 text-white font-semibold px-8 py-2 h-auto"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                      מעלה...
                    </>
                  ) : "העלאת הקובץ"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
