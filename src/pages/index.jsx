import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import UploadFile from "./UploadFile";

import MyFiles from "./MyFiles";

import Courses from "./Courses";

import Course from "./Course";

import Insights from "./Insights";

import Help from "./Help";

import AdminPanel from "./AdminPanel";

import TrackInquiries from "./TrackInquiries";

import AdminStudentManagement from "./AdminStudentManagement";

import AdminCourseManagement from "./AdminCourseManagement";

import AdminFileManagement from "./AdminFileManagement";

import AdminLecturerManagement from "./AdminLecturerManagement";

import Notifications from "./Notifications";

import LecturerApprovedFiles from "./LecturerApprovedFiles";

import LecturerRejectedFiles from "./LecturerRejectedFiles";

import LecturerPendingFiles from "./LecturerPendingFiles";

import Settings from "./Settings";

import AdminManagement from "./AdminManagement";

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
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
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
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}