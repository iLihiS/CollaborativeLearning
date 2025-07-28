
import React, { useState, useEffect } from "react";
import { Course } from "@/api/entities";
import { Lecturer } from "@/api/entities";
import { User } from "@/api/entities"; // New import: User entity
import { Student } from "@/api/entities"; // New import: Student entity
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, User as UserIcon, Calendar, Search } from "lucide-react"; // Renamed User import from lucide-react to UserIcon to avoid conflict with User entity

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null); // New state for current student

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch current user and student data
      const currentUser = await User.me();
      // Assuming Student entity has a filter method that accepts an object
      const studentRecords = await Student.filter({ email: currentUser.email });
      const currentStudent = studentRecords[0]; // Get the first student record
      setStudent(currentStudent); // Set the student state

      // Load all courses and lecturers concurrently
      const [allCourses, allLecturers] = await Promise.all([
        Course.list("-semester"), // Fetch courses, sorted by semester descending
        Lecturer.list() // Fetch all lecturers
      ]);
      
      // Map lecturers by their ID for easy lookup
      const lecturersMap = allLecturers.reduce((acc, lec) => {
        acc[lec.id] = lec.full_name;
        return acc;
      }, {});
      
      // Filter courses based on student's academic tracks
      let filteredCourses = allCourses; // Initialize with all courses
      if (currentStudent?.academic_track) { // Check if the student has academic tracks defined
        // Split the academic_track string into an array, filtering out empty strings
        const studentTracks = currentStudent.academic_track.split(', ').filter(Boolean);
        
        // Apply filtering logic based on the outline's specification
        // The current logic stated in the outline is:
        // "For now, we'll show all courses if student has tracks (you can add specific filtering logic here)"
        // And the implementation for this placeholder is `return studentTracks.length > 0;` inside the filter.
        // This means if studentTracks has any elements, all courses will pass the filter.
        // If studentTracks is empty (after splitting and filtering Boolean), no courses will pass.
        filteredCourses = allCourses.filter(course => {
          // This condition ensures that if the student has any tracks listed, all courses are shown.
          // If studentTracks is empty, no courses will be shown.
          // This is a placeholder for more specific track-based filtering logic.
          return studentTracks.length > 0;
        });
      }
      
      setCourses(filteredCourses); // Update courses state with the (potentially) filtered list
      setLecturers(lecturersMap); // Update lecturers state
    } catch (error) {
      console.error("Error loading courses:", error);
    }
    setLoading(false); // Set loading to false once data is loaded or an error occurs
  };
  
  // Filter courses based on the search term entered by the user
  const filteredCourses = courses.filter(course =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
           <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-lime-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <BookOpen className="w-6 h-6 text-white"/>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">רשימת קורסים</h1>
          </div>
          {/* Note: text-white on bg-slate-50 might make this text hard to see */}
          <p className="text-white mt-3">מצא חומרי לימוד לפי הקורסים הזמינים במערכת</p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="חפש קורס לפי שם או קוד..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-12 h-12 text-base focus-visible:ring-lime-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Card key={i} className="border border-transparent shadow-lg h-full bg-white animate-pulse">
                <CardHeader>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                  <div className="border-t mt-4 pt-4 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <Link to={createPageUrl(`Course?id=${course.id}`)} key={course.id} className="group block h-full">
                <Card className="border border-transparent shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 h-full group-hover:bg-lime-50 group-hover:border-lime-200 bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-lime-200">
                      <BookOpen className="w-6 h-6 text-lime-700 transition-colors duration-300 group-hover:text-lime-800" />
                    </div>
                    <CardTitle className="text-black transition-colors duration-300 group-hover:text-lime-800 text-lg leading-tight">{course.course_name}</CardTitle>
                    <Badge className="mt-2 font-mono text-xs w-fit bg-lime-100 text-lime-800 border border-lime-300">{course.course_code}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                      {course.description 
                          ? (course.description.length > 100 ? `${course.description.substring(0, 100)}...` : course.description)
                          : 'אין תיאור זמין לקורס זה.'
                      }
                    </p>
                    <div className="space-y-2 border-t pt-4 mt-auto">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <UserIcon className="w-4 h-4" /> {/* Using UserIcon to avoid conflict */}
                            <span>{lecturers[course.lecturer_id] || 'מרצה לא ידוע'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>{course.semester}</span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        {filteredCourses.length === 0 && !loading && searchTerm === "" && (
          <div className="text-center text-slate-600 p-8">
            <p className="text-lg font-semibold">לא נמצאו קורסים זמינים.</p>
            {student && student.academic_track && student.academic_track.split(', ').filter(Boolean).length === 0 && (
              <p className="text-sm mt-2">יתכן ואין קורסים המשויכים למסלולים האקדמיים שלך, או שמסלוליך אינם מוגדרים כראוי.</p>
            )}
          </div>
        )}
        {filteredCourses.length === 0 && !loading && searchTerm !== "" && (
          <div className="text-center text-slate-600 p-8">
            <p className="text-lg font-semibold">לא נמצאו קורסים עבור החיפוש "{searchTerm}".</p>
            <p className="text-sm mt-2">נסה מונח חיפוש אחר.</p>
          </div>
        )}
      </div>
    </div>
  );
}
