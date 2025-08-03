
import { useState, useEffect } from 'react';
import { Student } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminStudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // Renamed from currentStudent
  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    email: '',
    academic_track: '',
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const studentList = await Student.list();
      setStudents(studentList);
    } catch (error) {
      console.error("Error loading students:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (student = null) => {
    setEditingStudent(student); // Renamed from setCurrentStudent
    if (student) {
      setFormData({
        full_name: student.full_name,
        student_id: student.student_id,
        email: student.email,
        academic_track: student.academic_track,
      });
    } else {
      setFormData({ full_name: '', student_id: '', email: '', academic_track: '' });
    }
    setIsDialogOpen(true);
  };

  // Wrapper function to align with outline's requested naming for edit action
  const handleEdit = (student) => {
    handleOpenDialog(student);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null); // Renamed from setCurrentStudent
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) { // Renamed from currentStudent
        await Student.update(editingStudent.id, formData); // Renamed from currentStudent.id
      } else {
        await Student.create(formData);
      }
      handleCloseDialog();
      loadStudents();
    } catch (error) {
      console.error("Failed to save student:", error);
      alert('שגיאה בשמירת הסטודנט.');
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק סטודנט זה?')) {
      try {
        await Student.delete(studentId);
        loadStudents();
      } catch (error) {
        console.error("Failed to delete student:", error);
        alert('שגיאה במחיקת הסטודנט.');
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
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">ניהול סטודנטים</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">הוספה, עריכה ומחיקה של סטודנטים רשומים</p>
          </div>
          <div>
            <Button onClick={() => handleOpenDialog()} className="bg-lime-500 hover:bg-lime-600 text-white">
              <Plus className="w-4 h-4 ml-2" />
              הוסף סטודנט חדש
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                <p className="mt-4 text-slate-500">טוען סטודנטים...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="hover:bg-[#ebeced]" style={{backgroundColor: '#ebeced'}}>
                      <TableHead className="text-right text-black">שם מלא</TableHead>
                      <TableHead className="text-right text-black">מספר ת.ז</TableHead>
                      <TableHead className="text-right text-black">כתובת מייל</TableHead>
                      <TableHead className="text-right text-black">מסלול אקדמי</TableHead>
                      <TableHead className="text-right text-black w-32">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <TableRow key={student.id} className="table-row-hover">
                          <TableCell className="font-medium text-right">{student.full_name}</TableCell>
                          <TableCell className="text-right">{student.student_id}</TableCell>
                          <TableCell className="text-right">{student.email}</TableCell>
                          <TableCell className="text-right">{student.academic_track}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="icon" onClick={() => handleEdit(student)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => handleDelete(student.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          אין סטודנטים במערכת
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
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-right">{editingStudent ? 'עריכת סטודנט' : 'הוספת סטודנט חדש'}</DialogTitle>
                  <DialogDescription className="text-right mt-2">
                    {editingStudent ? 'ערוך את פרטי הסטודנט.' : 'מלא את פרטי הסטודנט החדש.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="full_name">שם מלא</Label>
                <Input id="full_name" value={formData.full_name} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="student_id">מספר ת.ז</Label>
                <Input id="student_id" value={formData.student_id} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input type="email" id="email" value={formData.email} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="academic_track">מסלול לימודים</Label>
                <Input id="academic_track" value={formData.academic_track} onChange={handleFormChange} required />
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
