
import React, { useState, useEffect } from 'react';
import { Lecturer } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminLecturerManagement() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLecturer, setCurrentLecturer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    semester_start: '',
  });

  useEffect(() => {
    loadLecturers();
  }, []);

  const loadLecturers = async () => {
    setLoading(true);
    try {
      const lecturerList = await Lecturer.list();
      setLecturers(lecturerList);
    } catch (error) {
      console.error("Error loading lecturers:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (lecturer = null) => {
    setCurrentLecturer(lecturer);
    if (lecturer) {
      setFormData({
        full_name: lecturer.full_name,
        email: lecturer.email,
        department: lecturer.department || '',
        semester_start: lecturer.semester_start,
      });
    } else {
      setFormData({ full_name: '', email: '', department: '', semester_start: '' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentLecturer(null);
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentLecturer) {
        await Lecturer.update(currentLecturer.id, formData);
      } else {
        await Lecturer.create(formData);
      }
      handleCloseDialog();
      loadLecturers();
    } catch (error) {
      console.error("Failed to save lecturer:", error);
      alert('שגיאה בשמירת המרצה.');
    }
  };

  const handleDelete = async (lecturerId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מרצה זה?')) {
      try {
        await Lecturer.delete(lecturerId);
        loadLecturers();
      } catch (error) {
          console.error("Failed to delete lecturer:", error);
          alert('שגיאה במחיקת המרצה.');
      }
    }
  };

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
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">ניהול מרצים</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">הוספה, עריכה וניהול של סגל המרצים</p>
          </div>
          <div>
            <Button onClick={() => handleOpenDialog()} className="bg-lime-500 hover:bg-lime-600 text-white">
              <Plus className="w-4 h-4 ml-2" />
              הוסף מרצה חדש
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                <p className="mt-4 text-slate-500">טוען מרצים...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="hover:bg-[#ebeced]" style={{backgroundColor: '#ebeced'}}>
                      <TableHead className="text-right text-black">שם מלא</TableHead>
                      <TableHead className="text-right text-black">כתובת מייל</TableHead>
                      <TableHead className="text-right text-black">מחלקה</TableHead>
                      <TableHead className="text-right text-black w-32">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lecturers.length > 0 ? (
                      lecturers.map((lecturer) => (
                        <TableRow key={lecturer.id} className="table-row-hover">
                          <TableCell className="font-medium text-right">{lecturer.full_name}</TableCell>
                          <TableCell className="text-right">{lecturer.email}</TableCell>
                          <TableCell className="text-right">{lecturer.department}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="icon" onClick={() => handleOpenDialog(lecturer)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => handleDelete(lecturer.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          אין מרצים במערכת
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
              <DialogTitle className="text-right">{currentLecturer ? 'עריכת מרצה' : 'הוספת מרצה חדש'}</DialogTitle>
              <DialogDescription className="text-right mt-2">
                {currentLecturer ? 'ערוך את פרטי המרצה.' : 'מלא את פרטי המרצה החדש.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="full_name">שם מלא</Label>
                <Input id="full_name" value={formData.full_name} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input type="email" id="email" value={formData.email} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="department">מחלקה</Label>
                <Input id="department" value={formData.department} onChange={handleFormChange} />
              </div>
              <div>
                <Label htmlFor="semester_start">סמסטר התחלה</Label>
                <Input id="semester_start" value={formData.semester_start} onChange={handleFormChange} required />
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
