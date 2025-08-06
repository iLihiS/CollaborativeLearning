import { useState, useEffect } from "react";
import { File as FileEntity, Course, Student, Lecturer, User } from "@/api/entities";
import {
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Box, Typography, Paper, CircularProgress, Avatar, Chip
} from '@mui/material';
import { Download, Eye, FileText, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

type File = {
    id: string;
    title: string;
    description: string;
    course_id: string;
    status: 'approved' | 'pending' | 'rejected';
    created_date: string;
    updated_date: string;
    file_type: string;
    uploader_id: string;
    file_url: string;
    rejection_reason?: string;
    lecturer_notes?: string;
};

type Course = {
    id: string;
    course_name: string;
};

type Student = {
    id: string;
    full_name: string;
};

export default function LecturerRejectedFiles() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<{ [key: string]: Course }>({});
    const [students, setStudents] = useState<{ [key: string]: Student }>({});
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = await User.me();
            setCurrentUser(user);

            const allFiles = await FileEntity.filter({ status: 'rejected' });
            let relevantFiles = allFiles;

            if (user.current_role !== 'admin') {
                const lecturerRecord = await Lecturer.filter({ user_id: user.id });
                if (lecturerRecord.length > 0) {
                    const lecturerCourseIds = (await Course.filter({ lecturer_id: lecturerRecord[0].id })).map((c: Course) => c.id);
                    relevantFiles = allFiles.filter((file: File) => lecturerCourseIds.includes(file.course_id));
                } else {
                    relevantFiles = [];
                }
            }
            
            setFiles(relevantFiles);
            
            const [courseList, studentList] = await Promise.all([Course.list(), Student.list()]);
            
            const courseMap = courseList.reduce((acc: { [key: string]: Course }, course: Course) => ({...acc, [course.id]: course }), {});
            const studentMap = studentList.reduce((acc: { [key: string]: Student }, student: Student) => ({...acc, [student.id]: student }), {});
            
            setCourses(courseMap);
            setStudents(studentMap);

        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setLoading(false);
    };
    
    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}><XCircle /></Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="bold">קבצים שנדחו</Typography>
                            <Typography color="text.secondary">רשימת כל חומרי הלימוד שנדחו</Typography>
                        </Box>
                    </Box>
                </Box>

                <Paper elevation={2}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>שם קובץ</TableCell>
                                    <TableCell>קורס</TableCell>
                                    <TableCell>תאריך דחייה</TableCell>
                                    <TableCell>סיבת הדחייה</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, lg: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}><XCircle /></Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">קבצים שנדחו</Typography>
                        <Typography color="text.secondary">רשימת כל חומרי הלימוד שנדחו</Typography>
                    </Box>
                </Box>
            </Box>

            <Paper elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>שם קובץ</TableCell>
                                <TableCell>קורס</TableCell>
                                <TableCell>תאריך דחייה</TableCell>
                                <TableCell>סיבת הדחייה</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {files.length > 0 ? (
                                files.map(file => (
                                    <TableRow key={file.id} hover>
                                        <TableCell>{file.title}</TableCell>
                                        <TableCell>{courses[file.course_id]?.course_name || 'לא ידוע'}</TableCell>
                                        <TableCell>{format(new Date(file.updated_date), 'd MMM yyyy', { locale: he })}</TableCell>
                                        <TableCell>
                                            {file.lecturer_notes ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <MessageSquare size={16} />
                                                    {file.lecturer_notes}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    לא צוינה סיבה
                                                </Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                            <XCircle size={48} />
                                            <Typography variant="h6">אין קבצים שנדחו</Typography>
                                            <Typography color="text.secondary">כאשר קבצים יידחו, הם יופיעו כאן.</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
