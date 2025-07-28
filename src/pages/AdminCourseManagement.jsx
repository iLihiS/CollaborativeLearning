
import React, { useState, useEffect } from 'react';
import { Course } from '@/api/entities';
import { Lecturer } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_name: '',
    course_code: '',
    lecturer_id: '',
    semester: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseList, lecturerList] = await Promise.all([Course.list(), Lecturer.list()]);
      setCourses(courseList);
      setLecturers(lecturerList);
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
      });
    } else {
      setFormData({ course_name: '', course_code: '', lecturer_id: '', semester: '', description: '' });
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

  const lecturersMap = lecturers.reduce((acc, lec) => {
    acc[lec.id] = lec.full_name;
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
            <p className="text-slate-500 dark:text-slate-400">יצירה, עריכה וניהול של קורסים וסמסטרים</p>
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
                      <TableHead className="text-right text-black">מרצה</TableHead>
                      <TableHead className="text-right text-black">סמסטר</TableHead>
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
                          <TableCell className="text-right">{course.semester}</TableCell>
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
          <DialogContent dir="rtl" className="sm:max-w-[525px]">
            <DialogHeader className="text-right pl-10">
              <DialogTitle className="text-right">{currentCourse ? 'עריכת קורס' : 'הוספת קורס חדש'}</DialogTitle>
              <DialogDescription className="text-right mt-2">
                {currentCourse ? 'ערוך את פרטי הקורס.' : 'מלא את פרטי הקורס החדש.'}
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
                    {lecturers.map(lecturer => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
