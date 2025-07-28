
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit, Trash2, Shield, UserCheck, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'admin',
    current_role: 'admin'
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      // Load all users with admin role
      const allUsers = await User.list();
      const adminUsers = allUsers.filter(user => user.role === 'admin');
      setAdmins(adminUsers);
    } catch (error) {
      console.error("Error loading admins:", error);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'admin',
      current_role: 'admin'
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      full_name: admin.full_name || '',
      email: admin.email || '',
      role: admin.role || 'admin',
      current_role: admin.current_role || 'admin'
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedAdmin) {
        await User.update(selectedAdmin.id, formData);
      } else {
        await User.create(formData);
      }
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (error) {
      console.error("Error saving admin:", error);
      alert("שגיאה בשמירת המנהל");
    }
  };

  const handleDelete = async (adminId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק מנהל זה?")) {
      try {
        await User.delete(adminId);
        loadAdmins();
      } catch (error) {
        console.error("Error deleting admin:", error);
        alert("שגיאה במחיקת המנהל");
      }
    }
  };

  const getRoleBadge = (role, currentRole) => {
    const roleText = currentRole === 'admin' ? 'מנהל פעיל' :
                     currentRole === 'lecturer' ? 'מרצה פעיל' :
                     currentRole === 'student' ? 'סטודנט פעיל' : 'מנהל';

    const colorClass = currentRole === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                       currentRole === 'lecturer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                       currentRole === 'student' ? 'bg-green-100 text-green-800 border-green-200' :
                       'bg-slate-100 text-slate-800 border-slate-200';

    return <Badge className={colorClass}>{roleText}</Badge>;
  };

  return (
    <>
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
                בחזרה לפאנל הניהול
              </Button>
            </Link>
          </div>

          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">ניהול מנהלים</h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-3">ניהול מנהלי המערכת והרשאותיהם</p>
            </div>
            <Button onClick={handleAdd} className="bg-lime-500 hover:bg-lime-600 text-white">
              <Plus className="w-4 h-4 ml-2" />
              הוסף מנהל חדש
            </Button>
          </div>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mx-auto mb-4"></div>
                  <p className="text-slate-500 dark:text-slate-400">טוען מנהלים...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="hover:bg-[#ebeced]" style={{backgroundColor: '#ebeced'}}>
                        <TableHead className="text-right text-black">שם מלא</TableHead>
                        <TableHead className="text-right text-black">כתובת מייל</TableHead>
                        <TableHead className="text-right text-black">תפקיד נוכחי</TableHead>
                        <TableHead className="text-right text-black">תאריך הצטרפות</TableHead>
                        <TableHead className="text-right text-black">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.length > 0 ? (
                        admins.map((admin) => (
                          <TableRow key={admin.id} className="table-row-hover">
                            <TableCell className="font-medium text-right">{admin.full_name || 'לא מוגדר'}</TableCell>
                            <TableCell className="text-right">{admin.email}</TableCell>
                            <TableCell className="text-right">{getRoleBadge(admin.role, admin.current_role)}</TableCell>
                            <TableCell className="text-right">{format(new Date(admin.created_date), 'd MMM yyyy', { locale: he })}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="icon" onClick={() => handleEdit(admin)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(admin.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                            אין מנהלים במערכת
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[525px]">
          <DialogHeader className="text-right pl-10"> {/* Added pl-10 here */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <DialogTitle className="text-right">הוסף מנהל חדש</DialogTitle>
                <DialogDescription className="text-right mt-2">
                  מלא את פרטי המנהל החדש.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-name">שם מלא</Label>
              <Input
                id="add-name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="הכנס שם מלא"
              />
            </div>
            <div>
              <Label htmlFor="add-email">כתובת מייל</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="הכנס כתובת מייל"
              />
            </div>
            <div>
              <Label htmlFor="add-current-role">תפקיד נוכחי</Label>
              <Select value={formData.current_role} onValueChange={(value) => setFormData({...formData, current_role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="admin">מנהל</SelectItem>
                  <SelectItem value="lecturer">מרצה</SelectItem>
                  <SelectItem value="student">סטודנט</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} className="bg-lime-500 hover:bg-lime-600">שמור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[525px]">
          <DialogHeader className="text-right pl-10"> {/* Added pl-10 here */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <DialogTitle className="text-right">ערוך מנהל</DialogTitle>
                <DialogDescription className="text-right mt-2">
                  ערוך את פרטי המנהל.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">שם מלא</Label>
              <Input
                id="edit-name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="הכנס שם מלא"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">כתובת מייל</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="הכנס כתובת מייל"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="edit-current-role">תפקיד נוכחי</Label>
              <Select value={formData.current_role} onValueChange={(value) => setFormData({...formData, current_role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="admin">מנהל</SelectItem>
                  <SelectItem value="lecturer">מרצה</SelectItem>
                  <SelectItem value="student">סטודנט</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} className="bg-lime-500 hover:bg-lime-600">שמור שינויים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
