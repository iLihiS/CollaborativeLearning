
import { useState, useEffect } from 'react';
import { Lecturer, AcademicTrack } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminLecturerManagement() {
  const [lecturers, setLecturers] = useState([]);
  const [academicTracks, setAcademicTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentLecturer, setCurrentLecturer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    academic_track_ids: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lecturerList, trackList] = await Promise.all([
        Lecturer.list(),
        AcademicTrack.list()
      ]);
      setLecturers(lecturerList);
      setAcademicTracks(trackList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (lecturer = null) => {
    setCurrentLecturer(lecturer);
    if (lecturer) {
      setFormData({
        full_name: lecturer.full_name,
        email: lecturer.email,
        academic_track_ids: lecturer.academic_track_ids || [],
      });
    } else {
      setFormData({ 
        full_name: '', 
        email: '', 
        academic_track_ids: [] 
      });
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

  const handleTrackToggle = (trackId) => {
    setFormData((prev) => ({
      ...prev,
      academic_track_ids: prev.academic_track_ids.includes(trackId)
        ? prev.academic_track_ids.filter(id => id !== trackId)
        : [...prev.academic_track_ids, trackId]
    }));
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
      loadData();
    } catch (error) {
      console.error("Failed to save lecturer:", error);
      alert('שגיאה בשמירת המרצה.');
    }
  };

  const handleDelete = async (lecturerId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק מרצה זה?')) {
      try {
        await Lecturer.delete(lecturerId);
        loadData();
      } catch (error) {
          console.error("Failed to delete lecturer:", error);
          alert('שגיאה במחיקת המרצה.');
      }
    }
  };
  
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
                      <TableHead className="text-right text-black">מסלולים אקדמיים</TableHead>
                      <TableHead className="text-right text-black w-32">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(lecturers) ? lecturers : []).length > 0 ? (
                      (Array.isArray(lecturers) ? lecturers : []).map((lecturer) => (
                        lecturer && <TableRow key={lecturer.id} className="table-row-hover">
                          <TableCell className="font-medium text-right">{lecturer.full_name}</TableCell>
                          <TableCell className="text-right">{lecturer.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap gap-1 justify-start">
                              {lecturer.academic_track_ids && lecturer.academic_track_ids.length > 0 ? (
                                lecturer.academic_track_ids.map(trackId => (
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
                            <div className="flex gap-2 justify-start">
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
          <DialogContent dir="rtl" className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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
                <Label className="text-base font-medium">מסלולים אקדמיים</Label>
                <div className="mt-2 space-y-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                  {(Array.isArray(academicTracks) ? academicTracks : []).map(track => (
                    track && <div key={track.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={track.id}
                        checked={formData.academic_track_ids.includes(track.id)}
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
