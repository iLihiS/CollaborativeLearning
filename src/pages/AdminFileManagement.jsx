
import React, { useState, useEffect } from 'react';
import { File } from '@/api/entities';
import { Course } from '@/api/entities';
import { Student } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Trash2, Check, X, Download, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminFileManagement() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [studentsMap, setStudentsMap] = useState({}); // This state is no longer used in the table but kept as it might be used elsewhere.
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredFiles(files);
    } else {
      setFilteredFiles(files.filter(file => file.status === statusFilter));
    }
  }, [statusFilter, files]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fileList, courseList, studentList] = await Promise.all([File.list(), Course.list(), Student.list()]);
      setFiles(fileList);
      // Re-apply filter after files are loaded, triggering the useEffect
      if (statusFilter === 'all') {
        setFilteredFiles(fileList);
      } else {
        setFilteredFiles(fileList.filter(file => file.status === statusFilter));
      }

      const cMap = courseList.reduce((acc, c) => ({ ...acc, [c.id]: c.course_name }), {});
      setCoursesMap(cMap);

      const sMap = studentList.reduce((acc, s) => ({ ...acc, [s.student_id]: s.full_name }), {});
      setStudentsMap(sMap);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };
  
  // This function is no longer triggered from the UI due to table structure changes.
  // Kept here in case it's used by other components or future features.
  const handleStatusChange = async (fileId, newStatus) => {
    try {
        await File.update(fileId, { status: newStatus });
        loadData();
    } catch (error) {
        console.error("Error updating status", error);
        alert("שגיאה בעדכון הסטטוס.");
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק קובץ זה?')) {
      try {
        await File.delete(fileId);
        loadData();
      } catch (error) {
        console.error("Failed to delete file:", error);
        alert('שגיאה במחיקת הקובץ.');
      }
    }
  };

  const getStatusComponent = (status) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 ml-1" />אושר</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 ml-1" />נדחה</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 ml-1" />ממתין</Badge>;
    }
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    const parts = url.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : '';
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
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">ניהול קבצים</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">צפייה וניהול של כל הקבצים שהועלו למערכת</p>
          </div>
          <div>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="סנן לפי סטטוס" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    <SelectItem value="pending">ממתין</SelectItem>
                    <SelectItem value="approved">מאושר</SelectItem>
                    <SelectItem value="rejected">נדחה</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto"></div>
                <p className="mt-4 text-slate-500">טוען קבצים...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="hover:bg-[#ebeced]" style={{backgroundColor: '#ebeced'}}>
                      <TableHead className="text-right text-black">שם קובץ</TableHead>
                      <TableHead className="text-right text-black">קורס</TableHead>
                      <TableHead className="text-right text-black">סוג</TableHead>
                      <TableHead className="text-right text-black">תאריך העלאה</TableHead>
                      <TableHead className="text-right text-black">סטטוס</TableHead>
                      <TableHead className="text-right text-black">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles.length > 0 ? (
                      filteredFiles.map((file) => (
                        <TableRow key={file.id} className="table-row-hover">
                          <TableCell className="font-medium text-right">{file.title}</TableCell>
                          <TableCell className="text-right">{coursesMap[file.course_id] || 'לא ידוע'}</TableCell>
                          <TableCell className="text-right">{getFileExtension(file.file_url)}</TableCell>
                          <TableCell className="text-right">{format(new Date(file.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                          <TableCell className="text-right">{getStatusComponent(file.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                               <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </a>
                               <Button variant="destructive" size="icon" onClick={() => handleDelete(file.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          אין קבצים במערכת
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
