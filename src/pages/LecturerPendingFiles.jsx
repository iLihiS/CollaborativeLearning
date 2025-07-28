
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Lecturer } from '@/api/entities';
import { File } from '@/api/entities';
import { Course } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, FileText, CheckSquare, Download } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function LecturerPendingFiles() {
  const [lecturer, setLecturer] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [fileToActOn, setFileToActOn] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();

      const lecturerRecords = await Lecturer.filter({ email: currentUser.email });
      
      const currentLecturer = lecturerRecords[0];
      setLecturer(currentLecturer);

      if (currentLecturer) {
        const [allFiles, allCourses] = await Promise.all([
            File.filter({ status: 'pending' }),
            Course.list()
        ]);
        
        const lecturerCourseIds = allCourses
          .filter(c => c.lecturer_id === currentLecturer.id)
          .map(c => c.id);

        const lecturerPendingFiles = allFiles.filter(f => lecturerCourseIds.includes(f.course_id));
        setPendingFiles(lecturerPendingFiles);

        const cMap = allCourses.reduce((acc, course) => {
            acc[course.id] = course.course_name;
            return acc;
        }, {});
        setCoursesMap(cMap);
      }
    } catch (error) {
      console.error("Error loading lecturer dashboard:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (fileId) => {
    try {
      await File.update(fileId, { status: 'approved' });
      setPendingFiles(pendingFiles.filter(f => f.id !== fileId));
    } catch(error) {
      console.error(`Failed to approve file:`, error);
      alert(`שגיאה באישור הקובץ.`);
    }
  };

  const handleOpenRejectDialog = (file) => {
    setFileToActOn(file);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!fileToActOn) return;
    try {
      await File.update(fileToActOn.id, { 
        status: 'rejected',
        lecturer_notes: rejectionReason 
      });
      setPendingFiles(pendingFiles.filter(f => f.id !== fileToActOn.id));
      setIsRejectDialogOpen(false);
      setFileToActOn(null);
    } catch(error) {
      console.error(`Failed to reject file:`, error);
      alert(`שגיאה בדחיית הקובץ.`);
    }
  };
  
  return (
    <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
      <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
              <div>
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                      <CheckSquare className="w-6 h-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">קבצים ממתינים לאישור</h1>
                  </div>
                  <p className="text-white mt-3">ניהול ואישור קבצים הממתינים לבדיקה</p>
              </div>
          </div>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-0">
              {loading ? <p className="p-6 text-center">טוען...</p> : pendingFiles.length > 0 ? (
                 <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>שם קובץ</TableHead>
                        <TableHead>קורס</TableHead>
                        <TableHead>הועלה בתאריך</TableHead>
                        <TableHead className="text-left">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingFiles.map(file => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">{file.title}</TableCell>
                          <TableCell>{coursesMap[file.course_id] || 'לא ידוע'}</TableCell>
                          <TableCell>{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                          <TableCell className="text-left">
                            <div className="flex gap-2 justify-end">
                               <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="icon">
                                      <Download className="w-4 h-4" />
                                  </Button>
                               </a>
                               <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-100" onClick={() => handleApprove(file.id)}>
                                  <Check className="w-4 h-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleOpenRejectDialog(file)}>
                                  <X className="w-4 h-4" />
                               </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                  <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-800">אין קבצים הממתינים לאישור</h3>
                      <p className="text-slate-500 mt-2">כל הקבצים טופלו. עבודה טובה!</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <DialogContent dir="rtl">
        <DialogHeader className="text-right pl-10">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <DialogTitle className="text-right">דחיית קובץ</DialogTitle>
              <DialogDescription className="text-right mt-2">
                הקובץ "{fileToActOn?.title}" יידחה. ניתן להוסיף סיבה לדחייה (אופציונלי).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="rejection-reason" className="text-right">
            סיבת הדחייה
          </Label>
          <Textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="לדוגמה: תוכן לא רלוונטי, חומר חלקי..."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>ביטול</Button>
          <Button variant="destructive" onClick={handleRejectSubmit}>דחה קובץ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
