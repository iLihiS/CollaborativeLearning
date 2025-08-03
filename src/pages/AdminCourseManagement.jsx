import { useState, useEffect } from 'react';
import { Course, Lecturer, AcademicTrack } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Book, Plus, Edit, Trash2, ArrowRight, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [academicTracks, setAcademicTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    lecturer_id: '',
    semester: '',
    description: '',
    academic_tracks: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseList, lecturerList, trackList] = await Promise.all([
        Course.list(), 
        Lecturer.list(),
        AcademicTrack.list()
      ]);
      setCourses(courseList);
      setLecturers(lecturerList);
      setAcademicTracks(trackList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course = null) => {
    setCurrentCourse(course);
    if (course) {
      setFormData({
        course_name: course.course_name,
        course_code: course.course_code,
        lecturer_id: course.lecturer_id,
        semester: course.semester,
        description: course.description || '',
        academic_tracks: course.academic_tracks || [],
      });
    } else {
      setFormData({ 
        course_name: '', 
        course_code: '', 
        lecturer_id: '', 
        semester: '', 
        description: '',
        academic_tracks: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentCourse(null);
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, lecturer_id: value }));
  };

  const handleTrackToggle = (trackId) => {
    setFormData((prev) => ({
      ...prev,
      academic_tracks: prev.academic_tracks.includes(trackId)
        ? prev.academic_tracks.filter(id => id !== trackId)
        : [...prev.academic_tracks, trackId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCourse) {
        await Course.update(currentCourse.id, formData);
      } else {
        await Course.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Failed to save course:", error);
      alert('שגיאה בשמירת הקורס.');
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קורס זה?')) {
      try {
        await Course.delete(courseId);
        loadData();
      } catch (error) {
        console.error("Failed to delete course:", error);
        alert('שגיאה במחיקת הקורס.');
      }
    }
  };

  const lecturersMap = (Array.isArray(lecturers) ? lecturers : []).reduce((acc, lec) => {
    if(lec) acc[lec.id] = lec.full_name;
    return acc;
  }, {});

  const tracksMap = (Array.isArray(academicTracks) ? academicTracks : []).reduce((acc, track) => {
    if(track) acc[track.id] = track.name;
    return acc;
  }, {});



  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <style>{`
        .table-row-hover:hover {
          background-color: #64748b !important;
          color: white !important;
        }
        .table-row-hover:hover * {
          color: white !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("AdminPanel")}>
            <Button variant="outline" className="hover:bg-slate-100 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לפאנל הניהול
            </Button>
          </Link>
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Book className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">ניהול קורסים</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">יצירה, עריכה וניהול של קורסים ושיוך למסלולים אקדמיים</p>
          </div>
          <div>
            <Button onClick={() => handleOpenDialog()} className="bg-lime-500 hover:bg-lime-600 text-white">
              <Plus className="w-4 h-4 ml-2" />
              הוסף קורס חדש
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                <p className="mt-4 text-slate-500">טוען קורסים...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="hover:bg-[#ebeced]" style={{backgroundColor: '#ebeced'}}>
                      <TableHead className="text-right text-black">שם קורס</TableHead>
                      <TableHead className="text-right text-black">קוד קורס</TableHead>
                      <TableHead className="text-right text-black">מרצה אחראי</TableHead>
                      <TableHead className="text-right text-black">מסלולים אקדמיים</TableHead>
                      <TableHead className="text-right text-black">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <TableRow key={course.id} className="table-row-hover">
                          <TableCell className="font-medium text-right">{course.course_name}</TableCell>
                          <TableCell className="text-right">{course.course_code}</TableCell>
                          <TableCell className="text-right">{lecturersMap[course.lecturer_id] || 'לא משויך'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {course.academic_tracks && course.academic_tracks.length > 0 ? (
                                course.academic_tracks.map(trackId => (
                                  <Badge key={trackId} variant="secondary" className="text-xs">
                                    <GraduationCap className="w-3 h-3 ml-1" />
                                    {tracksMap[trackId] || trackId}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-slate-400 text-sm">לא שויך</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(course)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => handleDelete(course.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          אין קורסים במערכת
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader className="text-right pl-10">
              <DialogTitle className="text-right">{currentCourse ? 'עריכת קורס' : 'הוספת קורס חדש'}</DialogTitle>
              <DialogDescription className="text-right mt-2">
                {currentCourse ? 'ערוך את פרטי הקורס ושיוך המסלולים.' : 'מלא את פרטי הקורס החדש ובחר מסלולים אקדמיים.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="course_name">שם הקורס</Label>
                <Input id="course_name" value={formData.course_name} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="course_code">קוד קורס</Label>
                <Input id="course_code" value={formData.course_code} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="semester">סמסטר</Label>
                <Input id="semester" value={formData.semester} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="lecturer_id">מרצה</Label>
                <Select onValueChange={handleSelectChange} value={formData.lecturer_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מרצה" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {(Array.isArray(lecturers) ? lecturers : []).map(lecturer => (
                      lecturer && <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-medium">מסלולים אקדמיים</Label>
                <div className="mt-2 space-y-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                  {(Array.isArray(academicTracks) ? academicTracks : []).map(track => (
                    track && <div key={track.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={track.id}
                        checked={formData.academic_tracks.includes(track.id)}
                        onCheckedChange={() => handleTrackToggle(track.id)}
                      />
                      <Label 
                        htmlFor={track.id} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {track.name} ({track.department})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="description">תיאור</Label>
                <Textarea id="description" value={formData.description} onChange={handleFormChange} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>ביטול</Button>
                <Button type="submit" className="bg-lime-500 hover:bg-lime-600 text-white">שמור</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
