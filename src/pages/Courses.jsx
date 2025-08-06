
import { useState, useEffect } from "react";
import { Course } from "@/api/entities";
import { Lecturer } from "@/api/entities";
import { User } from "@/api/entities"; // New import: User entity
import { Student } from "@/api/entities"; // New import: Student entity
import { AcademicTrack } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, User as UserIcon, Calendar, Search } from "lucide-react"; // Renamed User import from lucide-react to UserIcon to avoid conflict with User entity

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterableTracks, setFilterableTracks] = useState([]);
  
  // Initialize state from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedTrack, setSelectedTrack] = useState(searchParams.get('track') || null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);

      const [allCourses, allLecturers, allAcademicTracks] = await Promise.all([
        Course.list("-semester"),
        Lecturer.list(),
        AcademicTrack.list(),
      ]);

      const lecturersMap = allLecturers.reduce((acc, lec) => {
        acc[lec.id] = lec.full_name;
        return acc;
      }, {});
      setLecturers(lecturersMap);

      if (user.current_role === 'admin') {
        setCourses(allCourses);
        setFilterableTracks(allAcademicTracks);
      } else {
        let userTrackIds = [];
        if (user.current_role === 'student') {
          const studentRecords = await Student.filter({ email: user.email });
          if (studentRecords.length > 0 && studentRecords[0].academic_track_ids) {
            userTrackIds = studentRecords[0].academic_track_ids;
          }
        } else if (user.current_role === 'lecturer') {
          const lecturerRecords = await Lecturer.filter({ email: user.email });
          if (lecturerRecords.length > 0 && lecturerRecords[0].academic_track_ids) {
            userTrackIds = lecturerRecords[0].academic_track_ids;
          }
        }
        
        const userCourses = userTrackIds.length > 0
          ? allCourses.filter(course => course.academic_track_ids?.some(trackId => userTrackIds.includes(trackId)))
          : [];
        setCourses(userCourses);
        
        const tracksForFiltering = allAcademicTracks.filter(track => userTrackIds.includes(track.id));
        setFilterableTracks(tracksForFiltering);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };
  
  const searchFilteredCourses = courses.filter(course => {
    const trackMatch = !selectedTrack || (course.academic_track_ids && course.academic_track_ids.includes(selectedTrack));
    const searchMatch = !searchTerm || course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) || course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
    return trackMatch && searchMatch;
  });

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

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Button
            size="sm"
            variant={!selectedTrack ? 'default' : 'outline'}
            onClick={() => setSelectedTrack(null)}
            className={!selectedTrack ? 'bg-lime-600 hover:bg-lime-700 text-white' : 'text-slate-700'}
          >
            הצג הכל
          </Button>
          {filterableTracks.map((track) => (
            <Button
              size="sm"
              key={track.id}
              variant={selectedTrack === track.id ? 'default' : 'outline'}
              onClick={() => setSelectedTrack(track.id)}
              className={selectedTrack === track.id ? 'bg-lime-600 hover:bg-lime-700 text-white' : 'text-slate-700'}
            >
              {track.name}
            </Button>
          ))}
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
            {searchFilteredCourses.map((course) => (
              <Link 
                to={createPageUrl(`Course?id=${course.id}&track=${selectedTrack || ''}&search=${searchTerm || ''}`)} 
                key={course.id} 
                className="group block h-full"
              >
                <Card className="border border-transparent shadow-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 h-full group-hover:bg-lime-50 group-hover:border-lime-200 bg-white">
                  <CardHeader>
                    <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-lime-200">
                      <BookOpen className="w-6 h-6 text-lime-700 transition-colors duration-300 group-hover:text-lime-800" />
                    </div>
                    <CardTitle className="text-slate-900 dark:text-white transition-colors duration-300 group-hover:text-lime-800 text-lg leading-tight">{course.course_name}</CardTitle>
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
        {searchFilteredCourses.length === 0 && !loading && searchTerm === "" && (
          <div className="text-center text-slate-600 p-8">
            <p className="text-lg font-semibold">לא נמצאו קורסים זמינים.</p>
            <p className="text-sm mt-2">
              {currentUser?.current_role === 'admin'
                ? 'נראה שעדיין לא הוספו קורסים למערכת.'
                : 'יתכן ואין קורסים המשויכים למסלולים האקדמיים שלך עבור תפקידך הנוכחי.'
              }
            </p>
          </div>
        )}
        {searchFilteredCourses.length === 0 && !loading && searchTerm !== "" && (
          <div className="text-center text-slate-600 p-8">
            <p className="text-lg font-semibold">לא נמצאו קורסים עבור החיפוש &quot;{searchTerm}&quot;.</p>
            <p className="text-sm mt-2">נסה מונח חיפוש אחר.</p>
          </div>
        )}
      </div>
    </div>
  );
}
