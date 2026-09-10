import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './hooks/useAuth';
import { DashboardLayout, LoadingSpinner } from './components/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import GroupsPage from './pages/Groups';
import GroupDetailPage from './pages/GroupDetail';
import StudentsPage from './pages/Students';
import StudentProfilePage from './pages/StudentProfile';
import InvitationsPage from './pages/Invitations';
import AssignmentsPage from './pages/Assignments';
import ExamsPage from './pages/Exams';
import AttendancePage from './pages/Attendance';
import AnnouncementsPage from './pages/Announcements';
import ResourcesPage from './pages/Resources';
import GradesPage from './pages/Grades';
import CalendarPage from './pages/Calendar';
import JitsiPage from './pages/Jitsi';
import SettingsPage from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/invitations" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><ExamsPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
        <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/jitsi" element={<ProtectedRoute><JitsiPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
