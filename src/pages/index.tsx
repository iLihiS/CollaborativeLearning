import { Layout } from "../components/layout/Layout";
import { DebugPanel } from "../components/DebugPanel";

import Dashboard from "./Dashboard.tsx";

import UploadFile from "./UploadFile.tsx";

import MyFiles from "./MyFiles.tsx";

import Courses from "./Courses.tsx";

import Course from "./Course.tsx";

import Insights from "./Insights.tsx";

import Help from "./Help.tsx";

import AdminPanel from "./AdminPanel.tsx";

import TrackInquiries from "./TrackInquiries.tsx";

import AdminStudentManagement from "./AdminStudentManagement.tsx";

import AdminCourseManagement from "./AdminCourseManagement.tsx";

import AdminFileManagement from "./AdminFileManagement.tsx";

import AdminLecturerManagement from "./AdminLecturerManagement.tsx";

import Notifications from "./Notifications.tsx";

import LecturerApprovedFiles from "./LecturerApprovedFiles.tsx";

import LecturerRejectedFiles from "./LecturerRejectedFiles.tsx";

import LecturerPendingFiles from "./LecturerPendingFiles.tsx";

import Settings from "./Settings.tsx";

import AdminManagement from "./AdminManagement.tsx";

import { ValidationDemo } from "../components/ValidationDemo";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    UploadFile: UploadFile,
    
    MyFiles: MyFiles,
    
    Courses: Courses,
    
    Course: Course,
    
    Insights: Insights,
    
    Help: Help,
    
    AdminPanel: AdminPanel,
    
    TrackInquiries: TrackInquiries,
    
    AdminStudentManagement: AdminStudentManagement,
    
    AdminCourseManagement: AdminCourseManagement,
    
    AdminFileManagement: AdminFileManagement,
    
    AdminLecturerManagement: AdminLecturerManagement,
    
    Notifications: Notifications,
    
    LecturerApprovedFiles: LecturerApprovedFiles,
    
    LecturerRejectedFiles: LecturerRejectedFiles,
    
    LecturerPendingFiles: LecturerPendingFiles,
    
    Settings: Settings,
    
    AdminManagement: AdminManagement,

    ValidationDemo: ValidationDemo,
    
}

function _getCurrentPage(url: string) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart && urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart?.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <>
            <Layout currentPageName={currentPage}>
                <Routes>            
                    
                        <Route path="/" element={<Dashboard />} />
                    
                    
                    <Route path="/Dashboard" element={<Dashboard />} />
                    
                    <Route path="/UploadFile" element={<UploadFile />} />
                    
                    <Route path="/MyFiles" element={<MyFiles />} />
                    
                    <Route path="/Courses" element={<Courses />} />
                    
                    <Route path="/Course" element={<Course />} />
                    
                    <Route path="/Insights" element={<Insights />} />
                    
                    <Route path="/Help" element={<Help />} />
                    
                    <Route path="/AdminPanel" element={<AdminPanel />} />
                    
                    <Route path="/TrackInquiries" element={<TrackInquiries />} />
                    
                    <Route path="/AdminStudentManagement" element={<AdminStudentManagement />} />
                    
                    <Route path="/AdminCourseManagement" element={<AdminCourseManagement />} />
                    
                    <Route path="/AdminFileManagement" element={<AdminFileManagement />} />
                    
                    <Route path="/AdminLecturerManagement" element={<AdminLecturerManagement />} />
                    
                    <Route path="/Notifications" element={<Notifications />} />
                    
                    <Route path="/LecturerApprovedFiles" element={<LecturerApprovedFiles />} />
                    
                    <Route path="/LecturerRejectedFiles" element={<LecturerRejectedFiles />} />
                    
                    <Route path="/LecturerPendingFiles" element={<LecturerPendingFiles />} />
                    
                    <Route path="/Settings" element={<Settings />} />
                    
                    <Route path="/AdminManagement" element={<AdminManagement />} />
                    
                    <Route path="/ValidationDemo" element={<ValidationDemo />} />
                    
                </Routes>
            </Layout>
        </>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}