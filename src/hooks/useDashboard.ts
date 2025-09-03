import { useState, useEffect } from 'react';
import { FirestoreService } from '@/services/firestoreService';
import { useAuth } from './useAuth';

interface DashboardData {
  // נתונים כלליים
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalFiles: number;
  
  // נתונים לפי תפקיד
  recentNotifications?: any[];
  recentMessages?: any[];
  recentFiles?: any[];
  myRecentMessages?: any[];
  myRecentFiles?: any[];
  
  // סטטיסטיקות נוספות
  pendingFiles?: number;
  approvedFiles?: number;
  rejectedFiles?: number;
  myPendingFiles?: number;
  myApprovedFiles?: number;
  myRejectedFiles?: number;
  myApprovedFilesCount?: number;
}

export const useDashboard = () => {
  const { session } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    totalFiles: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🎯 Loading dashboard data for ${session.current_role}: ${session.user.id}`);
      
      const data = await FirestoreService.getDashboardData(
        session.user.id,
        session.current_role
      );

      setDashboardData({
        totalStudents: 0,
        totalLecturers: 0,
        totalCourses: 0,
        totalFiles: 0,
        ...data
      });
      console.log(`✅ Dashboard data loaded:`, data);

    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתוני דשבורד');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    await loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, [session?.user.id, session?.current_role]);

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard
  };
};

export default useDashboard; 